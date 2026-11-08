import React, { useState } from 'react';
import StatisticsPlayerPicker from './ui/StatisticsPlayerPicker.jsx';
import { statisticsCopy, teamStatisticsCopy, teamManagementCopy } from './statisticsCopy.js';
import { readHistory, statisticsGames, isTeamGame, teamLabel, playerDirectory, isDuel, matchKey, deleteMatches, undoDeletion, HISTORY_KEY, ARCHIVE_KEY, HIDDEN_KEY } from './statisticsHistory.js';
export default function StatisticsDashboard({ lang, t, showToast, ThemedSelect }) {
    const [stored, setStored] = useState(() => {
      try { return { games: readHistory(localStorage), error: false }; }
      catch { return { games: [], error: true }; }
    });
    const [scope, setScope] = useState('players');
    const list = statisticsGames(stored.games, scope);
    const labels = teamStatisticsCopy(lang);
    const displayName = scope === 'teams' ? teamLabel : name => name;
    const legacyTeams = stored.games.filter(g => isTeamGame(g) && !Array.isArray(g.teams)).length;
    const setList = games => setStored({ games, error: false });
    const baseCopy = statisticsCopy(lang);
    const copy = scope === 'teams' ? {...baseCopy, ...teamManagementCopy(lang), players:labels.teams, player:labels.team, opponent:labels.opponent, pairOnly:labels.pair, recent:labels.teams, hint:labels.note} : baseCopy;
    const [hidden, setHidden] = useState(() => { try { const value=JSON.parse(localStorage.getItem(scope === 'teams' ? HIDDEN_KEY+'.teams' : HIDDEN_KEY)||'[]'); return Array.isArray(value) ? value : []; } catch { return []; } });
    const [canUndo, setCanUndo] = useState(() => { try { return Boolean(localStorage.getItem(ARCHIVE_KEY)); } catch { return false; } });
    const [pending, setPending] = useState(null);
    const [historyLimit, setHistoryLimit] = useState(20);
    const deleteDialog = React.useRef(null);
    const [view, setView] = useState('overview');
    const [filter, setFilter] = useState('all');
    const [player, setPlayer] = useState('');
    const [p1, setP1] = useState('');
    const [p2, setP2] = useState('');

    const STATS_I18N = {
      cs:{statistics:'Statistiky',noSaved:'Zatím nejsou odehrané žádné uložené zápasy.',overview:'Přehled',h2h:'Vzájemné zápasy',all:'Vše',week:'Týden',month:'Měsíc',year:'Rok',avg3:'Průměr / 3 šipky',first9:'Prvních 9',checkoutPct:'Checkout %',checkoutPending:'Přesná evidence pokusů bude doplněna',highestCheckout:'Nejvyšší checkout',scoring:'Náhozy',performance:'Výkony',bestLeg:'Nejlepší leg (šipky)',avgDartsLeg:'Průměr šipek / leg',highestScore:'Nejvyšší nához',winRate:'Úspěšnost výher',matches:'vzájemných zápasů',legs:'Legy',sets:'Sety',last5:'Forma posledních 5',avgTrend:'Trend průměru',matchHistory:'Historie vzájemných zápasů',won:'vyhrál',draw:'remíza',checkout:'Checkout',detailed:({detailed,total})=>`Detailní metriky jsou dostupné u ${detailed} z ${total} zápasů. Starší zápasy zůstávají započítané do výher.`,older:'Starší zápasy jsou započítané do H2H skóre a úspěšnosti výher. Detailní metriky se plní jen u nově uložených zápasů.'},
      en:{statistics:'Statistics',noSaved:'No saved matches yet.',overview:'Overview',h2h:'Head-to-Head',all:'All',week:'Week',month:'Month',year:'Year',avg3:'3-dart AVG',first9:'First 9',checkoutPct:'Checkout %',checkoutPending:'Exact attempt tracking pending',highestCheckout:'Highest checkout',scoring:'Scoring',performance:'Performance',bestLeg:'Best leg (darts)',avgDartsLeg:'Avg darts / leg',highestScore:'Highest score',winRate:'Win rate',matches:'matches',legs:'Legs',sets:'Sets',last5:'Last 5 form',avgTrend:'AVG trend',matchHistory:'Match history',won:'won',draw:'draw',checkout:'Checkout',detailed:({detailed,total})=>`Detailed metrics are available for ${detailed} of ${total} matches. Older matches still count toward wins.`,older:'Older matches count toward H2H score and win rate. Detailed metrics populate for newly saved matches.'},
      de:{statistics:'Statistiken',noSaved:'Noch keine gespeicherten Spiele.',overview:'Übersicht',h2h:'Direkte Duelle',all:'Alle',week:'Woche',month:'Monat',year:'Jahr',avg3:'3-Dart-Schnitt',first9:'Erste 9',checkoutPct:'Checkout %',checkoutPending:'Exakte Versuchsstatistik folgt',highestCheckout:'Höchstes Checkout',scoring:'Scoring',performance:'Leistung',bestLeg:'Bestes Leg (Darts)',avgDartsLeg:'Ø Darts / Leg',highestScore:'Höchster Score',winRate:'Siegquote',matches:'direkte Duelle',legs:'Legs',sets:'Sätze',last5:'Form letzte 5',avgTrend:'AVG-Trend',matchHistory:'Duell-Historie',won:'gewann',draw:'Unentschieden',checkout:'Checkout',detailed:({detailed,total})=>`Detaillierte Werte sind für ${detailed} von ${total} Spielen verfügbar. Ältere Spiele zählen weiter für Siege.`,older:'Ältere Spiele zählen für H2H und Siegquote. Detailwerte werden nur bei neu gespeicherten Spielen erfasst.'},
      es:{statistics:'Estadísticas',noSaved:'Aún no hay partidas guardadas.',overview:'Resumen',h2h:'Cara a cara',all:'Todo',week:'Semana',month:'Mes',year:'Año',avg3:'Promedio / 3 dardos',first9:'Primeros 9',checkoutPct:'Checkout %',checkoutPending:'El registro exacto de intentos se añadirá',highestCheckout:'Checkout más alto',scoring:'Puntuación',performance:'Rendimiento',bestLeg:'Mejor leg (dardos)',avgDartsLeg:'Prom. dardos / leg',highestScore:'Puntuación más alta',winRate:'Porcentaje de victorias',matches:'enfrentamientos',legs:'Legs',sets:'Sets',last5:'Forma últimos 5',avgTrend:'Tendencia AVG',matchHistory:'Historial de enfrentamientos',won:'ganó',draw:'empate',checkout:'Checkout',detailed:({detailed,total})=>`Las métricas detalladas están disponibles en ${detailed} de ${total} partidas. Las anteriores siguen contando para las victorias.`,older:'Las partidas anteriores cuentan para el H2H y el porcentaje de victorias. Las métricas detalladas solo se guardan en partidas nuevas.'},
      nl:{statistics:'Statistieken',noSaved:'Nog geen opgeslagen wedstrijden.',overview:'Overzicht',h2h:'Onderling',all:'Alles',week:'Week',month:'Maand',year:'Jaar',avg3:'Gem. / 3 darts',first9:'Eerste 9',checkoutPct:'Checkout %',checkoutPending:'Exacte pogingregistratie volgt',highestCheckout:'Hoogste checkout',scoring:'Scores',performance:'Prestaties',bestLeg:'Beste leg (darts)',avgDartsLeg:'Gem. darts / leg',highestScore:'Hoogste score',winRate:'Winstpercentage',matches:'onderlinge wedstrijden',legs:'Legs',sets:'Sets',last5:'Vorm laatste 5',avgTrend:'AVG-trend',matchHistory:'Onderlinge historie',won:'won',draw:'gelijkspel',checkout:'Checkout',detailed:({detailed,total})=>`Gedetailleerde statistieken zijn beschikbaar voor ${detailed} van ${total} wedstrijden. Oudere wedstrijden blijven meetellen voor winst.`,older:'Oudere wedstrijden tellen mee voor H2H en winstpercentage. Detailstatistieken worden alleen bij nieuwe wedstrijden opgeslagen.'},
      ru:{statistics:'Статистика',noSaved:'Сохранённых матчей пока нет.',overview:'Обзор',h2h:'Личные встречи',all:'Все',week:'Неделя',month:'Месяц',year:'Год',avg3:'Среднее / 3 дротика',first9:'Первые 9',checkoutPct:'Checkout %',checkoutPending:'Точный учёт попыток будет добавлен',highestCheckout:'Максимальный checkout',scoring:'Наборы',performance:'Результаты',bestLeg:'Лучший лег (дротики)',avgDartsLeg:'Ср. дротиков / лег',highestScore:'Максимальный набор',winRate:'Процент побед',matches:'очных матчей',legs:'Леги',sets:'Сеты',last5:'Форма за 5 матчей',avgTrend:'Тренд среднего',matchHistory:'История личных встреч',won:'победил',draw:'ничья',checkout:'Checkout',detailed:({detailed,total})=>`Подробная статистика доступна для ${detailed} из ${total} матчей. Старые матчи по-прежнему учитываются в победах.`,older:'Старые матчи учитываются в H2H и проценте побед. Подробные метрики сохраняются только для новых матчей.'},
      zh:{statistics:'统计',noSaved:'暂无已保存的比赛。',overview:'概览',h2h:'对战',all:'全部',week:'一周',month:'一月',year:'一年',avg3:'3镖平均',first9:'前9镖',checkoutPct:'结镖率',checkoutPending:'精确尝试次数统计稍后加入',highestCheckout:'最高结镖',scoring:'得分',performance:'表现',bestLeg:'最佳局（镖数）',avgDartsLeg:'平均镖数 / 局',highestScore:'最高得分',winRate:'胜率',matches:'场对战',legs:'局',sets:'盘',last5:'最近5场状态',avgTrend:'平均分趋势',matchHistory:'对战记录',won:'获胜',draw:'平局',checkout:'结镖',detailed:({detailed,total})=>`详细数据适用于 ${detailed}/${total} 场比赛。旧比赛仍计入胜场。`,older:'旧比赛仍计入对战比分和胜率。详细数据仅记录新保存的比赛。'}
    };
    const S=(key,vars)=>{const pack=STATS_I18N[lang]||STATS_I18N.en;const value=pack[key]??STATS_I18N.en[key]??key;return typeof value==='function'?value(vars||{}):value;};
    const now = Date.now();
    const cutoff = {
      all: 0,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
      year: now - 365 * 24 * 60 * 60 * 1000
    }[filter] || 0;
    const filtered = list.filter(g => (g.ts || 0) >= cutoff);
    const directory = playerDirectory(list, hidden);
    const allPlayers = directory.map(p => p.name);

    React.useEffect(() => {
      if (!allPlayers.includes(player)) setPlayer(allPlayers[0] || '');
      if (!allPlayers.includes(p1)) setP1(allPlayers[0] || '');
      const first = allPlayers.includes(p1) ? p1 : allPlayers[0];
      if (!allPlayers.includes(p2) || p2 === first) setP2(allPlayers.find(n => n !== first) || '');
    }, [JSON.stringify(allPlayers), player, p1, p2]);
    React.useEffect(() => { setHistoryLimit(20); }, [view, filter, player, p1, p2]);
    React.useEffect(() => {
      const dialog=deleteDialog.current;
      if (pending && dialog && !dialog.open) dialog.showModal();
      if (!pending && dialog?.open) dialog.close();
    }, [pending]);

    const updateHidden = value => {
      try { localStorage.setItem(scope === 'teams' ? HIDDEN_KEY+'.teams' : HIDDEN_KEY, JSON.stringify(value)); setHidden(value); }
      catch { showToast(copy.writeError); }
    };
    const changeScope = next => {
      setScope(next); setPending(null); setPlayer(''); setP1(''); setP2('');
      try {const value=JSON.parse(localStorage.getItem(next === 'teams' ? HIDDEN_KEY+'.teams' : HIDDEN_KEY)||'[]');setHidden(Array.isArray(value)?value:[]);}catch{setHidden([]);}
    };
    const requestDelete = games => setPending({ keys: games.map(matchKey), count: games.length, period: S(filter) });
    const confirmDelete = () => {
      try { setList(deleteMatches(localStorage, pending.keys)); setCanUndo(true); setPending(null); showToast(copy.deleted); }
      catch { showToast(copy.writeError); }
    };
    const restoreDeleted = () => {
      try { setList(undoDeletion(localStorage)); setCanUndo(false); showToast(copy.restored); }
      catch { showToast(copy.writeError); }
    };
    const exportBackup = () => {
      try {
        const data={format:'DartScore statistics backup',version:1,exportedAt:new Date().toISOString(),history:readHistory(localStorage)};
        const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
        const link=document.createElement('a'); link.href=url; link.download=`DartScore-statistics-${new Date().toISOString().slice(0,10)}.json`; link.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
      } catch { showToast(copy.readError); }
    };

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
      .filter(g => isDuel(g, p1, p2))
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
        <div style={{ fontSize:14, fontWeight:800 }}>{label}</div>
        {note && <div style={{ fontSize:14, opacity:.65, marginTop:3 }}>{note}</div>}
      </div>
    );

    const compareRow = (a, label, b) => (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 1fr', gap:8, alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--line)' }}>
        <strong style={{ textAlign:'right' }}>{a}</strong><span style={{ textAlign:'center', fontSize:14, opacity:.75 }}>{label}</span><strong>{b}</strong>
      </div>
    );

    const selectedGames = (view === 'overview' ? playerGames : h2hGames).slice().sort((a,b)=>(b.ts||0)-(a.ts||0));

    return (
      <section className="lobbyCard statisticsView stats-dashboard" aria-label={S('statistics')}>
        <h2 className="stats-title">
          <span className="stats-title-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 4v16h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="7" y="12" width="3" height="5" rx="1" fill="currentColor" opacity=".55" />
              <rect x="12" y="8" width="3" height="9" rx="1" fill="currentColor" opacity=".8" />
              <rect x="17" y="4" width="3" height="13" rx="1" fill="currentColor" />
            </svg>
          </span>
          {S('statistics')}
        </h2>
        <div className="stats-actions" style={{marginBottom:12}}>
          <button type="button" className={`tab ${scope === 'players' ? 'active' : ''}`} aria-pressed={scope === 'players'} onClick={()=>changeScope('players')}>{labels.people}</button>
          <button type="button" className={`tab ${scope === 'teams' ? 'active' : ''}`} aria-pressed={scope === 'teams'} onClick={()=>changeScope('teams')}>{labels.teams}</button>
        </div>
        {scope === 'teams' && <p className="stats-muted">{labels.note}</p>}
        {legacyTeams > 0 && <p className="stats-muted">{labels.legacy} ({legacyTeams})</p>}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          <div className="stats-view-tabs" style={{ display:'flex', gap:6 }}>
            <button type="button" className={`tab ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}>{S('overview')}</button>
            <button type="button" className={`tab ${view === 'h2h' ? 'active' : ''}`} onClick={() => setView('h2h')}>{S('h2h')}</button>
          </div>
        </div>

        <p className="stats-muted">{copy.local} · {directory.length} {copy.players.toLocaleLowerCase()} · {list.length} {copy.matches.toLocaleLowerCase()}</p>
        {stored.error && <p role="alert">{copy.readError}</p>}

        {!directory.length && <p role="status">{S('noSaved')}</p>}

        <div className="stats-filter-row">
          <ThemedSelect className="input" aria-label={S('all')} value={filter} onChange={e => setFilter(e.target.value)} style={{ minHeight:44, minWidth:105 }}>
            <option value="all">{S('all')}</option><option value="week">{S('week')}</option><option value="month">{S('month')}</option><option value="year">{S('year')}</option>
          </ThemedSelect>
        <details className="stats-management"><summary>{copy.manage}</summary>
          <p className="stats-muted">{copy.hideNote}</p>
          <div className="stats-actions">
            <button type="button" onClick={exportBackup} disabled={stored.error || !list.length}>{copy.export}</button>
            {view === 'overview' && player && <button type="button" onClick={()=>updateHidden([...new Set([...hidden,player])])}>{copy.hide}</button>}
            {hidden.length > 0 && <button type="button" onClick={()=>updateHidden([])}>{copy.restore} ({hidden.length})</button>}
            <button type="button" className="stats-danger" disabled={!selectedGames.length || stored.error} onClick={()=>requestDelete(selectedGames)}>{view === 'overview' ? copy.deletePlayer : copy.deletePair} ({selectedGames.length})</button>
            {canUndo && <button type="button" onClick={restoreDeleted}>{copy.undo}</button>}
          </div>
        </details>
        </div>
        <div className={view === 'h2h' ? 'stats-picker-row stats-picker-pair' : 'stats-picker-row'}>

          {view === 'overview' ? (
            <StatisticsPlayerPicker displayName={displayName} players={directory} value={player} onChange={setPlayer} label={copy.player} copy={copy} />
          ) : (
            <>
              <StatisticsPlayerPicker displayName={displayName} players={directory} value={p1} onChange={setP1} label={copy.player} copy={copy} />
              <StatisticsPlayerPicker displayName={displayName} players={directory} value={p2} exclude={p1} onChange={setP2} label={copy.opponent} copy={copy} />
            </>
          )}
        </div>
        {view === 'h2h' && <p className="stats-muted">{copy.pairOnly}</p>}
        {!selectedGames.length && directory.length > 0 && <p role="status">{copy.empty}</p>}

        {view === 'overview' ? (
          <>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {metricCard(fmt(overview.avg3), S('avg3'))}
              {metricCard(fmt(overview.first9Avg), S('first9'))}
              {metricCard(pct(overview.winRate), S('winRate'), `${overview.wins} / ${overview.matches} ${copy.matches.toLocaleLowerCase()}`)}
              {metricCard(overview.highestCheckout ?? '—', S('highestCheckout'))}
            </div>
            <div style={{ marginTop:14 }}><strong>{S('scoring')}</strong><div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginTop:8, textAlign:'center' }}>
              {[['60+',overview.score60],['100+',overview.score100],['140+',overview.score140],['180',overview.score180]].map(([k,v]) => <div key={k} style={{ padding:8, border:'1px solid var(--line)', borderRadius:10 }}><div style={{ fontWeight:900, fontSize:18 }}>{v}</div><div style={{ fontSize:14, opacity:.7 }}>{k}</div></div>)}
            </div></div>
            <div style={{ marginTop:14 }}><strong>{S('performance')}</strong>
              <div className="stats-metric-grid">
                {metricCard(overview.bestLeg ?? '—', S('bestLeg'))}
                {metricCard(fmt(overview.avgDartsPerLeg), S('avgDartsLeg'))}
                {metricCard(overview.highestScore ?? '—', S('highestScore'))}
                {metricCard(overview.rows.reduce((sum,x)=>sum+(Number(x.stat.dartsThrown)||0),0),copy.darts)}
              </div>
            </div>
            {overview.detailedMatches < overview.matches && <div style={{ marginTop:10, fontSize:14, opacity:.65 }}>{S('detailed', { detailed: overview.detailedMatches, total: overview.matches })}</div>}
          </>
        ) : (
          <>
            <div style={{ textAlign:'center', padding:'6px 0 12px' }}>
              <div style={{ fontSize:13, opacity:.75 }}>{h2hGames.length} {S('matches')}</div>
              <div style={{ fontSize:30, fontWeight:900, marginTop:2 }}><span>{displayName(p1)}</span> <span style={{ color:'var(--accent)' }}>{p1Wins} : {p2Wins}</span> <span>{displayName(p2)}</span></div>
              <div style={{ display:'flex', justifyContent:'center', gap:24, marginTop:4, fontSize:14 }}><strong>{pct(h1.winRate)}</strong><span style={{ opacity:.55 }}>{S('winRate')}</span><strong>{pct(h2.winRate)}</strong></div>
            </div>

            <div style={{ marginTop:4 }}>
              {compareRow(h1.legsWon, S('legs'), h2.legsWon)}
              {compareRow(h1.setsWon, S('sets'), h2.setsWon)}
              {compareRow(fmt(h1.avg3), S('avg3'), fmt(h2.avg3))}
              {compareRow(fmt(h1.first9Avg), S('first9'), fmt(h2.first9Avg))}
              {compareRow(pct(h1.checkoutPct), S('checkoutPct'), pct(h2.checkoutPct))}
              {compareRow(h1.highestCheckout ?? '—', S('highestCheckout'), h2.highestCheckout ?? '—')}
              {compareRow(h1.score180, '180s', h2.score180)}
            </div>

            <div style={{ marginTop:14 }}><strong>{S('last5')}</strong>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, flexWrap:'wrap' }}>
                {form.length ? form.map((x,i) => <span key={i} style={{ width:30, height:30, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:900, background:x === 'W' ? 'rgba(34,197,94,.22)' : 'rgba(239,68,68,.22)', border:'1px solid var(--line)' }}>{x}</span>) : <span style={{ opacity:.65 }}>—</span>}
                {form.length > 0 && <span style={{ fontSize:14, opacity:.7 }}>{displayName(p1)}: {form.filter(x => x === 'W').length}–{form.filter(x => x === 'L').length}</span>}
              </div>
            </div>

            <div style={{ marginTop:14 }}><strong>{S('avgTrend')}</strong>{sparkline(trend) || <div style={{ opacity:.65, marginTop:8 }}>—</div>}</div>

            {h1.detailedMatches < h2hGames.length && <div style={{ marginTop:8, fontSize:14, opacity:.65 }}>{S('older')}</div>}

            <div style={{ marginTop:16 }}><strong>{S('matchHistory')}</strong>
              <div style={{ marginTop:8, display:'grid', gap:7 }}>
                {h2hGames.length ? h2hGames.slice(0,historyLimit).map((g,idx) => {
                  const s1=(g.playerStats||[]).find(s=>s.name===p1), s2=(g.playerStats||[]).find(s=>s.name===p2);
                  return <details key={`${g.ts}-${idx}`} style={{ border:'1px solid var(--line)', borderRadius:10, padding:'8px 10px', background:'rgba(255,255,255,.02)' }}>
                    <summary style={{ cursor:'pointer', fontWeight:800 }}>
                      {new Date(g.ts).toLocaleDateString()} · {g.result === 'draw' ? S('draw') : `${displayName(g.winner === p1 ? p1 : p2)} ${S('won')}`}
                    </summary>
                    <div style={{ marginTop:8 }}>{compareRow(fmt(s1?.avg3), S('avg3'), fmt(s2?.avg3))}{compareRow(fmt(s1?.first9Avg), S('first9'), fmt(s2?.first9Avg))}{compareRow(s1?.legsWon ?? '—', S('legs'), s2?.legsWon ?? '—')}{compareRow(s1?.setsWon ?? '—', S('sets'), s2?.setsWon ?? '—')}{compareRow(s1?.highestCheckout ?? '—', S('checkout'), s2?.highestCheckout ?? '—')}</div>
                    <button type="button" className="stats-danger" onClick={()=>requestDelete([g])}>{copy.deleteMatch}</button>
                  </details>;
                }) : <div style={{ opacity:.65 }}>—</div>}
              </div>
            </div>
          </>
        )}
        {view === 'overview' && selectedGames.length > 0 && <details className="stats-history"><summary>{copy.history} ({selectedGames.length})</summary>
          {selectedGames.slice(0,historyLimit).map((g,index)=><details className="stats-match" key={`${g.ts}-${index}`}><summary>{new Date(g.ts).toLocaleDateString(lang)} · {g.players.map(displayName).join(' / ')}</summary><p>{displayName(g.winner) || S('draw')}</p><button type="button" className="stats-danger" onClick={()=>requestDelete([g])}>{copy.deleteMatch}</button></details>)}
        </details>}
        {selectedGames.length > historyLimit && <button type="button" className="stats-more" onClick={()=>setHistoryLimit(n=>n+20)}>{copy.more} ({Math.min(historyLimit,selectedGames.length)}/{selectedGames.length})</button>}
        <dialog ref={deleteDialog} className="stats-delete-dialog" aria-labelledby="stats-delete-title" onCancel={()=>setPending(null)} onClose={()=>setPending(null)}>
          <h2 id="stats-delete-title">{copy.confirm}</h2>
          <p>{copy.warning.replace('{count}',pending?.count ?? 0).replace('{period}',pending?.period ?? '')}</p>
          <p className="stats-muted">{copy.backupHint}</p>
          <div className="stats-actions"><button type="button" autoFocus onClick={()=>setPending(null)}>{copy.cancel}</button><button type="button" onClick={exportBackup}>{copy.export}</button><button type="button" className="stats-danger" onClick={confirmDelete}>{copy.confirm} ({pending?.count ?? 0})</button></div>
        </dialog>
      </section>
    );
  }

