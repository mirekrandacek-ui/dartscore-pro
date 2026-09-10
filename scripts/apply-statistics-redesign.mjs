import fs from 'node:fs';

const path = 'src/App.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(needle, replacement, label) {
  const count = src.split(needle).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  src = src.replace(needle, replacement);
}
function insertAfter(needle, addition, label) {
  replaceOnce(needle, needle + addition, label);
}
function replaceBetween(start, end, replacement, label) {
  const a = src.indexOf(start);
  const b = src.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`${label}: markers not found`);
  src = src.slice(0, a) + replacement + src.slice(b);
}

// --- Statistics aggregation helper ---
insertAfter(
  "const getCheckoutHint = (score, dartsLeft, rules = {}) => {",
  "",
  'checkout helper anchor'
);

const helperAnchor = "\n/* ===== Ikona reproduktoru ===== */";
const statsHelpers = `

/* ===== Statistics helpers ===== */
const emptyDetailedStats = (player) => ({
  id: player?.id || '',
  name: player?.name || '',
  dartsThrown: 0,
  pointsScored: 0,
  first9Darts: 0,
  first9Points: 0,
  avg3: null,
  first9Avg: null,
  score60: 0,
  score100: 0,
  score140: 0,
  score180: 0,
  highestScore: null,
  legsWon: 0,
  setsWon: 0,
  bestLeg: null,
  avgDartsPerLeg: null,
  highestCheckout: null,
  checkoutPct: null
});

const buildClassicPlayerStats = (visits, players, setsWon = []) => {
  const safeVisits = Array.isArray(visits) ? visits : [];
  const completedLegs = Array.from(new Set(safeVisits.filter(v => v?.wonLeg).map(v => v.leg)));

  return players.map((player, scoreIdx) => {
    const stat = emptyDetailedStats(player);
    const mine = safeVisits.filter(v => v?.scoreIdx === scoreIdx);
    stat.dartsThrown = mine.reduce((sum, v) => sum + (Number(v.dartsUsed) || 0), 0);
    stat.pointsScored = mine.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    stat.avg3 = stat.dartsThrown > 0 ? (stat.pointsScored / stat.dartsThrown) * 3 : null;
    stat.legsWon = mine.filter(v => v?.wonLeg).length;
    stat.setsWon = Number(setsWon?.[scoreIdx]) || 0;
    stat.highestScore = mine.length ? Math.max(...mine.map(v => Number(v.total) || 0)) : null;
    stat.highestCheckout = mine.some(v => Number(v.checkout) > 0)
      ? Math.max(...mine.map(v => Number(v.checkout) || 0))
      : null;

    mine.forEach(v => {
      const total = Number(v.total) || 0;
      if (total === 180) stat.score180 += 1;
      else if (total >= 140) stat.score140 += 1;
      else if (total >= 100) stat.score100 += 1;
      else if (total >= 60) stat.score60 += 1;
    });

    const legDarts = [];
    completedLegs.forEach(leg => {
      const legMine = mine.filter(v => v.leg === leg);
      const darts = legMine.reduce((sum, v) => sum + (Number(v.dartsUsed) || 0), 0);
      if (darts > 0) legDarts.push({ leg, darts, won: legMine.some(v => v?.wonLeg) });

      let remaining = 9;
      legMine.forEach(v => {
        if (remaining <= 0) return;
        const used = Math.min(remaining, Number(v.dartsUsed) || 0);
        if (used <= 0) return;
        const dartCount = Number(v.dartsUsed) || 0;
        const ratio = dartCount > 0 ? used / dartCount : 0;
        stat.first9Points += (Number(v.total) || 0) * ratio;
        stat.first9Darts += used;
        remaining -= used;
      });
    });

    stat.first9Avg = stat.first9Darts > 0 ? (stat.first9Points / stat.first9Darts) * 3 : null;
    const wonLegDarts = legDarts.filter(x => x.won).map(x => x.darts);
    stat.bestLeg = wonLegDarts.length ? Math.min(...wonLegDarts) : null;
    stat.avgDartsPerLeg = legDarts.length
      ? legDarts.reduce((sum, x) => sum + x.darts, 0) / legDarts.length
      : null;
    return stat;
  });
};
`;
replaceOnce(helperAnchor, statsHelpers + helperAnchor, 'insert statistics helpers');

// --- Match-wide visit history ---
insertAfter(
  "  const [lastTurn, setLastTurn] = useState([]); // součet posledního kola\n",
  "  const [classicVisitHistory, setClassicVisitHistory] = useState([]); // dokončené návštěvy napříč legy\n  const [classicLegSeq, setClassicLegSeq] = useState(1);\n",
  'statistics state'
);

insertAfter(
  "    setDarts([]);\n\n    if (mode === 'classic') {",
  "\n    setClassicVisitHistory([]);\n    setClassicLegSeq(1);\n",
  'reset stats on start'
);

// Snapshot + restore.
replaceOnce(
  "      scores, darts, mult, actions, thrown, lastTurn,\n      winner, pendingWin,",
  "      scores, darts, mult, actions, thrown, lastTurn,\n      classicVisitHistory, classicLegSeq,\n      winner, pendingWin,",
  'snapshot statistics fields'
);
insertAfter(
  "        setLastTurn(s.lastTurn || []);\n",
  "        setClassicVisitHistory(Array.isArray(s.classicVisitHistory) ? s.classicVisitHistory : []);\n        setClassicLegSeq(Number.isInteger(s.classicLegSeq) ? Math.max(1, s.classicLegSeq) : 1);\n",
  'restore statistics fields'
);
replaceOnce(
  "      scores, darts, mult, actions, thrown, lastTurn,\n      winner, pendingWin,\n      cricket, around,",
  "      scores, darts, mult, actions, thrown, lastTurn,\n      classicVisitHistory, classicLegSeq,\n      winner, pendingWin,\n      cricket, around,",
  'save effect dependencies'
);

// --- Classic per-visit recording ---
// Bust by individual dart.
insertAfter(
  "      speak(lang, t(lang, 'bust'), voiceOn);\n      playHitSound();\n\n      pushAction({\n        type: 'bust',",
  "",
  'bust anchor'
);
replaceOnce(
  "        dartsBefore: [...darts],\n      });\n\n      setScores(sc => sc.map((x, i) => (i === scoreIdx ? roundStartScore : x)));",
  "        dartsBefore: [...darts],\n        statVisitAdded: true,\n      });\n\n      setClassicVisitHistory(history => [...history, {\n        leg: classicLegSeq, scoreIdx, total: 0, dartsUsed: Math.min(3, darts.length + 1),\n        checkout: null, wonLeg: false\n      }]);\n\n      setScores(sc => sc.map((x, i) => (i === scoreIdx ? roundStartScore : x)));",
  'record dart bust visit'
);

// Invalid zero finish bust.
replaceOnce(
  "          dartsBefore: [...darts],\n        });\n\n        setScores(sc => sc.map((x, i) => (i === scoreIdx ? roundStartScore : x)));",
  "          dartsBefore: [...darts],\n          statVisitAdded: true,\n        });\n\n        setClassicVisitHistory(history => [...history, {\n          leg: classicLegSeq, scoreIdx, total: 0, dartsUsed: Math.min(3, darts.length + 1),\n          checkout: null, wonLeg: false\n        }]);\n\n        setScores(sc => sc.map((x, i) => (i === scoreIdx ? roundStartScore : x)));",
  'record invalid finish bust visit'
);

// Valid finish: compute final visit once and pass to finalizer.
insertAfter(
  "      // povolený finish\n      playHitSound();",
  "\n      const finishVisit = {\n        leg: classicLegSeq,\n        scoreIdx,\n        total: darts.reduce((sum, d) => sum + (d?.score || 0), 0) + hit,\n        dartsUsed: Math.min(3, darts.length + 1),\n        checkout: roundStartScore,\n        wonLeg: true\n      };\n      setClassicVisitHistory(history => [...history, finishVisit]);",
  'record valid finish visit'
);
replaceOnce(
  "        hit: { v, m, score: hit },\n      });",
  "        hit: { v, m, score: hit },\n        statVisitAdded: true,\n      });",
  'mark valid finish action'
);
replaceOnce(
  "          completeClassicLeg(scoreIdx);",
  "          completeClassicLeg(scoreIdx, { finalVisit: finishVisit });",
  'pass final visit to leg completion'
);

// Normal dart action marks whether this dart closes a 3-dart visit.
replaceOnce(
  "      hit: { v, m, score: hit },\n    });\n\n    setScores(sc => sc.map((x, i) => (i === scoreIdx ? tentative : x)));",
  "      hit: { v, m, score: hit },\n      statVisitAdded: darts.length + 1 >= 3,\n    });\n\n    setScores(sc => sc.map((x, i) => (i === scoreIdx ? tentative : x)));",
  'mark normal dart visit completion'
);
replaceOnce(
  "      if (nd.length >= 3) {\n        speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);",
  "      if (nd.length >= 3) {\n        setClassicVisitHistory(history => [...history, {\n          leg: classicLegSeq, scoreIdx, total, dartsUsed: 3, checkout: null, wonLeg: false\n        }]);\n        speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);",
  'record completed dart visit'
);

// Round-total bust and visits.
replaceOnce(
  "        dartsBefore: [...darts],\n      });\n\n      setDarts([]);",
  "        dartsBefore: [...darts],\n        statVisitAdded: true,\n      });\n\n      setClassicVisitHistory(history => [...history, {\n        leg: classicLegSeq, scoreIdx, total: 0, dartsUsed: 3, checkout: null, wonLeg: false\n      }]);\n      setDarts([]);",
  'record round bust visit'
);

replaceOnce(
  "      playHitSound();\n\n      pushAction({\n        type: 'round',\n        mode: 'classic',",
  "      playHitSound();\n\n      const finishVisit = {\n        leg: classicLegSeq, scoreIdx, total, dartsUsed: 3, checkout: prev, wonLeg: true\n      };\n      setClassicVisitHistory(history => [...history, finishVisit]);\n\n      pushAction({\n        type: 'round',\n        mode: 'classic',",
  'record round finish visit'
);
replaceOnce(
  "        thrownDelta: 3,\n      });\n\n      setScores(sc => sc.map((x, i) => (i === scoreIdx ? 0 : x)));",
  "        thrownDelta: 3,\n        statVisitAdded: true,\n      });\n\n      setScores(sc => sc.map((x, i) => (i === scoreIdx ? 0 : x)));",
  'mark round finish action'
);
replaceOnce(
  "        completeClassicLeg(scoreIdx);\n      }\n\n      resetMult();\n      return;\n    }\n\n    playHitSound();",
  "        completeClassicLeg(scoreIdx, { finalVisit: finishVisit });\n      }\n\n      resetMult();\n      return;\n    }\n\n    playHitSound();",
  'pass round final visit'
);
replaceOnce(
  "      thrownDelta: 3,\n    });\n\n    setScores(sc => sc.map((x, i) => (i === scoreIdx ? tentative : x)));",
  "      thrownDelta: 3,\n      statVisitAdded: true,\n    });\n\n    setClassicVisitHistory(history => [...history, {\n      leg: classicLegSeq, scoreIdx, total, dartsUsed: 3, checkout: null, wonLeg: false\n    }]);\n\n    setScores(sc => sc.map((x, i) => (i === scoreIdx ? tentative : x)));",
  'record normal round visit'
);

// Undo current-leg visit aggregates when the corresponding action is undone.
insertAfter(
  "    const last = st[st.length - 1];\n",
  "    if (last?.mode === 'classic' && last?.statVisitAdded) {\n      const targetScoreIdx = last.scoreIdx ?? last.pIdx;\n      setClassicVisitHistory(history => {\n        const copy = [...history];\n        for (let i = copy.length - 1; i >= 0; i -= 1) {\n          if (copy[i]?.scoreIdx === targetScoreIdx && copy[i]?.leg === classicLegSeq) {\n            copy.splice(i, 1);\n            break;\n          }\n        }\n        return copy;\n      });\n    }\n",
  'undo statistics visit'
);

// Advance leg sequence after any non-final leg.
insertAfter(
  "      setClassicLegTransition(true);",
  "\n      setClassicLegSeq(seq => seq + 1);",
  'advance statistics leg sequence'
);

// On match win, enrich the durable record with detailed Classic stats.
replaceOnce(
  "        finalizeWin(scoreIdx, opts);\n        return;",
  "        finalizeWin(scoreIdx, { ...opts, finalSetsWon: nextSets });\n        return;",
  'pass final sets to match finalizer'
);

replaceOnce(
  "          if (mode === 'classic' && Array.isArray(scores)) {",
  "          if (mode === 'classic' && playerMode === 'individual') {\n            const visitsForRecord = opts.finalVisit\n              ? [...classicVisitHistory, opts.finalVisit]\n              : classicVisitHistory;\n            gameRecord.playerMode = playerMode;\n            gameRecord.legsToWinSet = legsToWinSet;\n            gameRecord.setsToWin = setsToWin;\n            gameRecord.playerStats = buildClassicPlayerStats(\n              visitsForRecord,\n              players,\n              opts.finalSetsWon || classicSetsWon\n            );\n            gameRecord.statsVersion = 1;\n          }\n          if (mode === 'classic' && Array.isArray(scores)) {",
  'store detailed finished match statistics'
);

// --- Replace old SavedGames with redesigned statistics dashboard ---
replaceOnce(
  "        {isPremium && <SavedGames lang={lang} t={t} showToast={showToast} />}",
  "        {isPremium && <StatisticsDashboard lang={lang} t={t} showToast={showToast} />}",
  'use redesigned statistics dashboard'
);

const dashboard = `  function StatisticsDashboard({ lang, t, showToast }) {
    const [list, setList] = useState(() => {
      try { return JSON.parse(localStorage.getItem('finishedGames') || '[]'); }
      catch { return []; }
    });
    const [view, setView] = useState('overview');
    const [filter, setFilter] = useState('all');
    const [player, setPlayer] = useState('');
    const [p1, setP1] = useState('');
    const [p2, setP2] = useState('');

    const L = (cs, en) => lang === 'cs' ? cs : en;
    const now = Date.now();
    const cutoff = {
      all: 0,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
      year: now - 365 * 24 * 60 * 60 * 1000
    }[filter] || 0;
    const filtered = list.filter(g => (g.ts || 0) >= cutoff);
    const allPlayers = Array.from(new Set(list.flatMap(g => g.players || []))).filter(Boolean).sort();

    React.useEffect(() => {
      if (!player && allPlayers.length) setPlayer(allPlayers[0]);
      if (!p1 && allPlayers.length) setP1(allPlayers[0]);
      if (!p2 && allPlayers.length > 1) setP2(allPlayers[1]);
    }, [allPlayers.join('|'), player, p1, p2]);

    const fmt = (n, digits = 1) => Number.isFinite(n) ? Number(n).toFixed(digits) : '—';
    const pct = n => Number.isFinite(n) ? `${Math.round(n)} %` : '—';

    const mergePlayerStats = (games, name) => {
      const rows = games
        .map(g => ({ game: g, stat: (g.playerStats || []).find(s => s.name === name) }))
        .filter(x => x.stat);
      const matches = games.filter(g => (g.players || []).includes(name));
      const wins = matches.filter(g => g.winner === name).length;
      const sum = key => rows.reduce((acc, x) => acc + (Number(x.stat?.[key]) || 0), 0);
      const darts = sum('dartsThrown');
      const points = sum('pointsScored');
      const f9d = sum('first9Darts');
      const f9p = sum('first9Points');
      const max = key => {
        const vals = rows.map(x => Number(x.stat?.[key])).filter(Number.isFinite);
        return vals.length ? Math.max(...vals) : null;
      };
      const min = key => {
        const vals = rows.map(x => Number(x.stat?.[key])).filter(n => Number.isFinite(n) && n > 0);
        return vals.length ? Math.min(...vals) : null;
      };
      return {
        matches: matches.length,
        wins,
        winRate: matches.length ? wins / matches.length * 100 : null,
        detailedMatches: rows.length,
        avg3: darts ? points / darts * 3 : null,
        first9Avg: f9d ? f9p / f9d * 3 : null,
        score60: sum('score60'), score100: sum('score100'), score140: sum('score140'), score180: sum('score180'),
        highestScore: max('highestScore'), highestCheckout: max('highestCheckout'),
        legsWon: sum('legsWon'), setsWon: sum('setsWon'),
        bestLeg: min('bestLeg'),
        avgDartsPerLeg: rows.length ? (() => {
          const vals = rows.map(x => Number(x.stat?.avgDartsPerLeg)).filter(Number.isFinite);
          return vals.length ? vals.reduce((a,b) => a+b,0) / vals.length : null;
        })() : null,
        checkoutPct: null,
        rows
      };
    };

    const playerGames = filtered.filter(g => (g.players || []).includes(player));
    const overview = mergePlayerStats(playerGames, player);
    const h2hGames = filtered
      .filter(g => p1 && p2 && p1 !== p2 && (g.players || []).includes(p1) && (g.players || []).includes(p2))
      .sort((a,b) => (b.ts || 0) - (a.ts || 0));
    const h1 = mergePlayerStats(h2hGames, p1);
    const h2 = mergePlayerStats(h2hGames, p2);
    const p1Wins = h2hGames.filter(g => g.winner === p1).length;
    const p2Wins = h2hGames.filter(g => g.winner === p2).length;
    const form = h2hGames.slice(0,5).map(g => g.winner === p1 ? 'W' : g.winner === p2 ? 'L' : '•');
    const trend = h2hGames.slice(0,10).reverse().map(g => {
      const s = (g.playerStats || []).find(x => x.name === p1);
      return Number.isFinite(Number(s?.avg3)) ? Number(s.avg3) : null;
    }).filter(Number.isFinite);

    const sparkline = values => {
      if (!values.length) return null;
      const min = Math.min(...values), max = Math.max(...values);
      const span = Math.max(1, max - min);
      const pts = values.map((v, i) => {
        const x = values.length === 1 ? 50 : (i / (values.length - 1)) * 100;
        const y = 34 - ((v - min) / span) * 28;
        return `${x},${y}`;
      }).join(' ');
      return <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width:'100%', height:52 }}><polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>;
    };

    const metricCard = (value, label, note) => (
      <div style={{ flex:'1 1 46%', minWidth:120, padding:'12px 10px', border:'1px solid var(--line)', borderRadius:12, background:'rgba(255,255,255,.03)', textAlign:'center' }}>
        <div style={{ fontSize:24, fontWeight:900, color:'var(--accent)' }}>{value}</div>
        <div style={{ fontSize:12, fontWeight:800 }}>{label}</div>
        {note && <div style={{ fontSize:10, opacity:.65, marginTop:3 }}>{note}</div>}
      </div>
    );

    const compareRow = (a, label, b) => (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 1fr', gap:8, alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--line)' }}>
        <strong style={{ textAlign:'right' }}>{a}</strong><span style={{ textAlign:'center', fontSize:12, opacity:.75 }}>{label}</span><strong>{b}</strong>
      </div>
    );

    if (!allPlayers.length) {
      return <div className="lobbyCard"><strong>{L('Statistiky','Statistics')}</strong><div style={{ opacity:.7, marginTop:8 }}>{L('Zatím nejsou odehrané žádné uložené zápasy.','No saved matches yet.')}</div></div>;
    }

    return (
      <div className="lobbyCard">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          <strong style={{ fontSize:18 }}>📊 {L('Statistiky','Statistics')}</strong>
          <div style={{ display:'flex', gap:6 }}>
            <button type="button" className={`tab ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}>{L('Přehled','Overview')}</button>
            <button type="button" className={`tab ${view === 'h2h' ? 'active' : ''}`} onClick={() => setView('h2h')}>Head to Head</button>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:12 }}>
          <ThemedSelect className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ height:32, minWidth:105 }}>
            <option value="all">{L('Vše','All')}</option><option value="week">{L('Týden','Week')}</option><option value="month">{L('Měsíc','Month')}</option><option value="year">{L('Rok','Year')}</option>
          </ThemedSelect>
          {view === 'overview' ? (
            <ThemedSelect className="input" value={player} onChange={e => setPlayer(e.target.value)} style={{ height:32, minWidth:140 }}>{allPlayers.map(n => <option key={n} value={n}>{n}</option>)}</ThemedSelect>
          ) : (
            <>
              <ThemedSelect className="input" value={p1} onChange={e => setP1(e.target.value)} style={{ height:32, minWidth:120 }}>{allPlayers.map(n => <option key={`p1-${n}`} value={n}>{n}</option>)}</ThemedSelect>
              <strong>vs</strong>
              <ThemedSelect className="input" value={p2} onChange={e => setP2(e.target.value)} style={{ height:32, minWidth:120 }}>{allPlayers.map(n => <option key={`p2-${n}`} value={n}>{n}</option>)}</ThemedSelect>
            </>
          )}
        </div>

        {view === 'overview' ? (
          <>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {metricCard(fmt(overview.avg3), '3-dart AVG')}
              {metricCard(fmt(overview.first9Avg), 'First 9')}
              {metricCard(pct(overview.checkoutPct), 'Checkout %', L('Přesná evidence pokusů bude doplněna','Exact attempt tracking pending'))}
              {metricCard(overview.highestCheckout ?? '—', L('Nejvyšší checkout','Highest checkout'))}
            </div>
            <div style={{ marginTop:14 }}><strong>{L('Scoring','Scoring')}</strong><div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginTop:8, textAlign:'center' }}>
              {[['60+',overview.score60],['100+',overview.score100],['140+',overview.score140],['180',overview.score180]].map(([k,v]) => <div key={k} style={{ padding:8, border:'1px solid var(--line)', borderRadius:10 }}><div style={{ fontWeight:900, fontSize:18 }}>{v}</div><div style={{ fontSize:11, opacity:.7 }}>{k}</div></div>)}
            </div></div>
            <div style={{ marginTop:14 }}><strong>{L('Výkony','Performance')}</strong>
              {compareRow(overview.bestLeg ?? '—', L('Nejlepší leg (šipky)','Best leg (darts)'), overview.matches ? `${overview.wins}/${overview.matches}` : '—')}
              {compareRow(fmt(overview.avgDartsPerLeg), L('Průměr šipek / leg','Avg darts / leg'), pct(overview.winRate))}
              {compareRow(overview.highestScore ?? '—', L('Nejvyšší nához','Highest score'), L('Win rate','Win rate'))}
            </div>
            {overview.detailedMatches < overview.matches && <div style={{ marginTop:10, fontSize:11, opacity:.65 }}>{L(`Detailní metriky jsou dostupné u ${overview.detailedMatches} z ${overview.matches} zápasů. Starší zápasy zůstávají započítané do výher.`,`Detailed metrics are available for ${overview.detailedMatches} of ${overview.matches} matches. Older matches still count toward wins.`)}</div>}
          </>
        ) : (
          <>
            <div style={{ textAlign:'center', padding:'6px 0 12px' }}>
              <div style={{ fontSize:13, opacity:.75 }}>{h2hGames.length} {L('vzájemných zápasů','matches')}</div>
              <div style={{ fontSize:30, fontWeight:900, marginTop:2 }}><span>{p1}</span> <span style={{ color:'var(--accent)' }}>{p1Wins} : {p2Wins}</span> <span>{p2}</span></div>
              <div style={{ display:'flex', justifyContent:'center', gap:24, marginTop:4, fontSize:12 }}><strong>{pct(h1.winRate)}</strong><span style={{ opacity:.55 }}>Win rate</span><strong>{pct(h2.winRate)}</strong></div>
            </div>

            <div style={{ marginTop:4 }}>
              {compareRow(h1.legsWon, 'Legs', h2.legsWon)}
              {compareRow(h1.setsWon, 'Sets', h2.setsWon)}
              {compareRow(fmt(h1.avg3), '3-dart AVG', fmt(h2.avg3))}
              {compareRow(fmt(h1.first9Avg), 'First 9', fmt(h2.first9Avg))}
              {compareRow(pct(h1.checkoutPct), 'Checkout %', pct(h2.checkoutPct))}
              {compareRow(h1.highestCheckout ?? '—', L('Nejvyšší checkout','Highest checkout'), h2.highestCheckout ?? '—')}
              {compareRow(h1.score180, '180s', h2.score180)}
            </div>

            <div style={{ marginTop:14 }}><strong>{L('Forma posledních 5','Last 5 form')}</strong>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, flexWrap:'wrap' }}>
                {form.length ? form.map((x,i) => <span key={i} style={{ width:30, height:30, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:900, background:x === 'W' ? 'rgba(34,197,94,.22)' : 'rgba(239,68,68,.22)', border:'1px solid var(--line)' }}>{x}</span>) : <span style={{ opacity:.65 }}>—</span>}
                {form.length > 0 && <span style={{ fontSize:12, opacity:.7 }}>{p1}: {form.filter(x => x === 'W').length}–{form.filter(x => x === 'L').length}</span>}
              </div>
            </div>

            <div style={{ marginTop:14 }}><strong>{L('Trend AVG','AVG trend')}</strong>{sparkline(trend) || <div style={{ opacity:.65, marginTop:8 }}>—</div>}</div>

            {h1.detailedMatches < h2hGames.length && <div style={{ marginTop:8, fontSize:11, opacity:.65 }}>{L('Starší zápasy jsou započítané do H2H skóre a win rate. Detailní metriky se plní jen u nově uložených zápasů.','Older matches count toward H2H score and win rate. Detailed metrics populate for newly saved matches.')}</div>}

            <div style={{ marginTop:16 }}><strong>{L('Historie vzájemných zápasů','Match history')}</strong>
              <div style={{ marginTop:8, display:'grid', gap:7 }}>
                {h2hGames.length ? h2hGames.map((g,idx) => {
                  const s1=(g.playerStats||[]).find(s=>s.name===p1), s2=(g.playerStats||[]).find(s=>s.name===p2);
                  return <details key={`${g.ts}-${idx}`} style={{ border:'1px solid var(--line)', borderRadius:10, padding:'8px 10px', background:'rgba(255,255,255,.02)' }}>
                    <summary style={{ cursor:'pointer', fontWeight:800 }}>{new Date(g.ts).toLocaleDateString()} · {g.winner === p1 ? p1 : p2} {L('vyhrál','won')}</summary>
                    <div style={{ marginTop:8 }}>{compareRow(fmt(s1?.avg3), 'AVG', fmt(s2?.avg3))}{compareRow(fmt(s1?.first9Avg), 'First 9', fmt(s2?.first9Avg))}{compareRow(s1?.legsWon ?? '—', 'Legs', s2?.legsWon ?? '—')}{compareRow(s1?.setsWon ?? '—', 'Sets', s2?.setsWon ?? '—')}{compareRow(s1?.highestCheckout ?? '—', L('Checkout','Checkout'), s2?.highestCheckout ?? '—')}</div>
                  </details>;
                }) : <div style={{ opacity:.65 }}>—</div>}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

`;
replaceBetween("  function SavedGames({", "  /* ===== GAME SCREEN ===== */", dashboard + "  /* ===== GAME SCREEN ===== */", 'replace SavedGames with statistics dashboard');

fs.writeFileSync(path, src);
console.log('Statistics redesign patch applied.');
