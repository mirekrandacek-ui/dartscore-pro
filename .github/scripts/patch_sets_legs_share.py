from pathlib import Path

APP = Path('src/App.jsx')
CSS = Path('src/app.css')
app = APP.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')

def rep(old, new, count=1):
    global app
    actual = app.count(old)
    if actual < count:
        raise SystemExit(f'Missing App.jsx anchor ({actual} < {count}): {old[:120]!r}')
    app = app.replace(old, new, count)

def rep_css(old, new, count=1):
    global css
    actual = css.count(old)
    if actual < count:
        raise SystemExit(f'Missing CSS anchor ({actual} < {count}): {old[:120]!r}')
    css = css.replace(old, new, count)

# ---- translations ----
translations = {
"    rouletteTotalPoints: 'Body celkem', roundCount: 'Počet kol',": "    rouletteTotalPoints: 'Body celkem', roundCount: 'Počet kol',\n    sets: 'Sety', legs: 'Legy', shareApp: 'Sdílet aplikaci',\n    shareText: 'DartScore Pro – počítadlo šipek', linkCopied: 'Odkaz zkopírován',\n    legWon: 'Leg pro', setWon: 'Set pro',",
"    rouletteTotalPoints: 'Total points', roundCount: 'Rounds',": "    rouletteTotalPoints: 'Total points', roundCount: 'Rounds',\n    sets: 'Sets', legs: 'Legs', shareApp: 'Share app',\n    shareText: 'DartScore Pro – darts scorer', linkCopied: 'Link copied',\n    legWon: 'Leg for', setWon: 'Set for',",
"    rouletteTotalPoints: 'Punkte gesamt', roundCount: 'Runden',": "    rouletteTotalPoints: 'Punkte gesamt', roundCount: 'Runden',\n    sets: 'Sätze', legs: 'Legs', shareApp: 'App teilen',\n    shareText: 'DartScore Pro – Darts-Zähler', linkCopied: 'Link kopiert',\n    legWon: 'Leg für', setWon: 'Satz für',",
"    rouletteTotalPoints: 'Puntos totales', roundCount: 'Rondas',": "    rouletteTotalPoints: 'Puntos totales', roundCount: 'Rondas',\n    sets: 'Sets', legs: 'Legs', shareApp: 'Compartir app',\n    shareText: 'DartScore Pro – marcador de dardos', linkCopied: 'Enlace copiado',\n    legWon: 'Leg para', setWon: 'Set para',",
"    rouletteTotalPoints: 'Totaal punten', roundCount: 'Rondes',": "    rouletteTotalPoints: 'Totaal punten', roundCount: 'Rondes',\n    sets: 'Sets', legs: 'Legs', shareApp: 'App delen',\n    shareText: 'DartScore Pro – dartscore', linkCopied: 'Link gekopieerd',\n    legWon: 'Leg voor', setWon: 'Set voor',",
"    rouletteTotalPoints: 'Всего очков', roundCount: 'Раунды',": "    rouletteTotalPoints: 'Всего очков', roundCount: 'Раунды',\n    sets: 'Сеты', legs: 'Леги', shareApp: 'Поделиться',\n    shareText: 'DartScore Pro – счётчик дартса', linkCopied: 'Ссылка скопирована',\n    legWon: 'Лег для', setWon: 'Сет для',",
"    rouletteTotalPoints: '总分', roundCount: '回合数',": "    rouletteTotalPoints: '总分', roundCount: '回合数',\n    sets: '盘', legs: '局', shareApp: '分享应用',\n    shareText: 'DartScore Pro – 飞镖计分器', linkCopied: '链接已复制',\n    legWon: '赢得一局', setWon: '赢得一盘',",
}
for old, new in translations.items():
    if old not in app:
        # Language strings may differ slightly; do not silently skip Czech/English/German.
        if old.startswith("    rouletteTotalPoints: 'Body") or old.startswith("    rouletteTotalPoints: 'Total") or old.startswith("    rouletteTotalPoints: 'Punkte"):
            raise SystemExit(f'Missing required translation anchor: {old}')
        continue
    app = app.replace(old, new, 1)

# ---- match format + progress state ----
rep(
"  const [outDouble, setOutDouble] = useState(true);\n  const [outTriple, setOutTriple] = useState(false);\n  const [outMaster, setOutMaster] = useState(false);",
"  const [outDouble, setOutDouble] = useState(true);\n  const [outTriple, setOutTriple] = useState(false);\n  const [outMaster, setOutMaster] = useState(false);\n\n  // Classic match format: first to N legs wins a set; first to N sets wins the match.\n  const [legsToWinSet, setLegsToWinSet] = useState(1);\n  const [setsToWin, setSetsToWin] = useState(1);\n  const [classicLegsWon, setClassicLegsWon] = useState([]);\n  const [classicSetsWon, setClassicSetsWon] = useState([]);\n  const [classicLegStarterIdx, setClassicLegStarterIdx] = useState(0);\n  const [classicLegTransition, setClassicLegTransition] = useState(false);"
)

# restore/save lobby format
rep(
"      if (typeof s.outMaster === 'boolean') setOutMaster(s.outMaster);\n      if (typeof s.randomOrder === 'boolean') setRandomOrder(s.randomOrder);",
"      if (typeof s.outMaster === 'boolean') setOutMaster(s.outMaster);\n      if (Number.isInteger(s.legsToWinSet) && s.legsToWinSet >= 1 && s.legsToWinSet <= 21) setLegsToWinSet(s.legsToWinSet);\n      if (Number.isInteger(s.setsToWin) && s.setsToWin >= 1 && s.setsToWin <= 21) setSetsToWin(s.setsToWin);\n      if (typeof s.randomOrder === 'boolean') setRandomOrder(s.randomOrder);"
)
rep(
"          outDouble, outTriple, outMaster,\n          randomOrder, playThrough, ai,",
"          outDouble, outTriple, outMaster,\n          legsToWinSet, setsToWin,\n          randomOrder, playThrough, ai,"
)
rep(
"    outDouble, outTriple, outMaster,\n    randomOrder, playThrough, ai, scoreInputMode, playerMode, players,",
"    outDouble, outTriple, outMaster,\n    legsToWinSet, setsToWin,\n    randomOrder, playThrough, ai, scoreInputMode, playerMode, players,"
)

# start/reset match progress
rep(
"      setScores(sc);\n      setThrown(dartsCnt);\n      setLastTurn(last);\n      setCricket(null);",
"      setScores(sc);\n      setThrown(dartsCnt);\n      setLastTurn(last);\n      setClassicLegsWon(Array.from({ length: scoreSlots }, () => 0));\n      setClassicSetsWon(Array.from({ length: scoreSlots }, () => 0));\n      setClassicLegStarterIdx(0);\n      setClassicLegTransition(false);\n      setCricket(null);"
)

# block extra classic input while transitioning to next leg
rep(
"  const commitClassic = (value, mOverride) => {\n    let v = value;",
"  const commitClassic = (value, mOverride) => {\n    if (classicLegTransition) return;\n    let v = value;"
)
rep(
"  const commitClassicRound = (roundScore) => {\n    const total = Number(roundScore);",
"  const commitClassicRound = (roundScore) => {\n    if (classicLegTransition) return;\n    const total = Number(roundScore);"
)

# Classic finishes now complete a leg, not necessarily the whole match.
if app.count('        finalizeWin(scoreIdx);') < 2:
    raise SystemExit('Expected two direct Classic finalizeWin(scoreIdx) calls')
app = app.replace('        finalizeWin(scoreIdx);', '        completeClassicLeg(scoreIdx);', 2)

# completeClassicLeg after finalizeWin
anchor = "    };\n\n   /* >>> DARTSCORE_UNIQUE_ANCHOR__TURN_SWITCH_HELPERS__START__7C2A <<< */"
if anchor not in app:
    raise SystemExit('Missing finalizeWin end anchor')
complete_leg = """    };

    const completeClassicLeg = (scoreIdx, opts = {}) => {
      if (mode !== 'classic' || winner != null || classicLegTransition) return;

      const scoreSlots = playerMode === 'teams' ? 3 : players.length;
      const safeLegsToWin = Math.min(21, Math.max(1, Number(legsToWinSet) || 1));
      const safeSetsToWin = Math.min(21, Math.max(1, Number(setsToWin) || 1));
      const nextLegs = Array.from({ length: scoreSlots }, (_, ix) => classicLegsWon[ix] || 0);
      const nextSets = Array.from({ length: scoreSlots }, (_, ix) => classicSetsWon[ix] || 0);

      nextLegs[scoreIdx] = (nextLegs[scoreIdx] || 0) + 1;
      let wonSet = false;

      if (nextLegs[scoreIdx] >= safeLegsToWin) {
        wonSet = true;
        nextSets[scoreIdx] = (nextSets[scoreIdx] || 0) + 1;
        nextLegs.fill(0);
      }

      setClassicLegsWon(nextLegs);
      setClassicSetsWon(nextSets);

      if ((nextSets[scoreIdx] || 0) >= safeSetsToWin) {
        finalizeWin(scoreIdx, opts);
        return;
      }

      setClassicLegTransition(true);
      const winnerName = playerMode === 'teams'
        ? teamNameByIndex(scoreIdx)
        : (players[scoreIdx]?.name || t(lang, 'player'));
      showToast(`${t(lang, wonSet ? 'setWon' : 'legWon')} ${winnerName}`);

      let nextStarter = 0;
      if (order.length > 0) {
        if (playerMode !== 'teams') {
          nextStarter = (classicLegStarterIdx + 1) % order.length;
        } else {
          const currentStartPlayer = order[classicLegStarterIdx] ?? order[0];
          const currentStartScoreIdx = scoreIndexForPlayer(currentStartPlayer);
          nextStarter = classicLegStarterIdx;
          for (let step = 1; step <= order.length; step += 1) {
            const candidate = (classicLegStarterIdx + step) % order.length;
            const candidatePlayer = order[candidate];
            if (scoreIndexForPlayer(candidatePlayer) !== currentStartScoreIdx) {
              nextStarter = candidate;
              break;
            }
          }
        }
      }

      window.setTimeout(() => {
        setScores(Array.from({ length: scoreSlots }, () => startScore));
        setThrown(Array.from({ length: scoreSlots }, () => 0));
        setLastTurn(Array.from({ length: scoreSlots }, () => 0));
        setActions([]);
        setDarts([]);
        setMult(1);
        setPendingWin(null);
        setCurrIdx(nextStarter);
        setClassicLegStarterIdx(nextStarter);
        setClassicLegTransition(false);
      }, 700);
    };

   /* >>> DARTSCORE_UNIQUE_ANCHOR__TURN_SWITCH_HELPERS__START__7C2A <<< */"""
app = app.replace(anchor, complete_leg, 1)

# play-through leg finish
rep(
"      finalizeWin(pendingWinRef.current.pIdx, { visitAlreadyCounted: true });",
"      completeClassicLeg(pendingWinRef.current.pIdx, { visitAlreadyCounted: true });"
)

# snapshot + restore progress
rep(
"      mode, startScore,\n      outDouble, outTriple, outMaster,\n      randomOrder, playThrough, ai,",
"      mode, startScore,\n      outDouble, outTriple, outMaster,\n      legsToWinSet, setsToWin, classicLegsWon, classicSetsWon, classicLegStarterIdx,\n      randomOrder, playThrough, ai,"
)
rep(
"        setStartScore(s.startScore || 501);\n        if (s.scoreInputMode) setScoreInputMode(s.scoreInputMode);",
"        setStartScore(s.startScore || 501);\n        setLegsToWinSet(Number.isInteger(s.legsToWinSet) ? Math.min(21, Math.max(1, s.legsToWinSet)) : 1);\n        setSetsToWin(Number.isInteger(s.setsToWin) ? Math.min(21, Math.max(1, s.setsToWin)) : 1);\n        if (s.scoreInputMode) setScoreInputMode(s.scoreInputMode);"
)
rep(
"        setWinner(s.winner ?? null);\n        setPendingWin(s.pendingWin ?? null);\n        setCricket(s.cricket ?? null);",
"        setWinner(s.winner ?? null);\n        setPendingWin(s.pendingWin ?? null);\n        const savedScoreSlots = (s.mode === 'classic' && s.playerMode === 'teams') ? 3 : (s.players?.length || 0);\n        setClassicLegsWon(Array.from({ length: savedScoreSlots }, (_, ix) => s.classicLegsWon?.[ix] || 0));\n        setClassicSetsWon(Array.from({ length: savedScoreSlots }, (_, ix) => s.classicSetsWon?.[ix] || 0));\n        setClassicLegStarterIdx(Number.isInteger(s.classicLegStarterIdx) ? Math.max(0, Math.min(s.classicLegStarterIdx, Math.max(0, (s.order?.length || 1) - 1))) : 0);\n        setClassicLegTransition(false);\n        setCricket(s.cricket ?? null);"
)
rep(
"      mode, startScore,\n      outDouble, outTriple, outMaster,\n      randomOrder, playThrough, ai,\n      scoreInputMode, playerMode,",
"      mode, startScore,\n      outDouble, outTriple, outMaster,\n      legsToWinSet, setsToWin, classicLegsWon, classicSetsWon, classicLegStarterIdx,\n      randomOrder, playThrough, ai,\n      scoreInputMode, playerMode,"
)

# Lobby call props
rep(
"      outMaster={outMaster} setOutMaster={setOutMaster}\n      randomOrder={randomOrder} setRandomOrder={setRandomOrder}",
"      outMaster={outMaster} setOutMaster={setOutMaster}\n      legsToWinSet={legsToWinSet} setLegsToWinSet={setLegsToWinSet}\n      setsToWin={setsToWin} setSetsToWin={setSetsToWin}\n      randomOrder={randomOrder} setRandomOrder={setRandomOrder}"
)

# Game call props
rep(
"    classicOutShortLabel={classicOutShortLabel}\n    players={players}",
"    classicOutShortLabel={classicOutShortLabel}\n    legsToWinSet={legsToWinSet}\n    setsToWin={setsToWin}\n    classicLegsWon={classicLegsWon}\n    classicSetsWon={classicSetsWon}\n    players={players}"
)

# Lobby signature + share function
rep(
"    outMaster, setOutMaster,\n    randomOrder, setRandomOrder,",
"    outMaster, setOutMaster,\n    legsToWinSet, setLegsToWinSet,\n    setsToWin, setSetsToWin,\n    randomOrder, setRandomOrder,"
)
rep(
"  }) {\n    const [showPremiumDetails, setShowPremiumDetails] = useState(false);\n    return (",
"  }) {\n    const [showPremiumDetails, setShowPremiumDetails] = useState(false);\n    const matchOptions = Array.from({ length: 21 }, (_, ix) => ix + 1);\n\n    const shareApp = async () => {\n      const url = 'https://play.google.com/store/apps/details?id=com.randis2288.dartscorepro';\n      const payload = { title: 'DartScore Pro', text: t(lang, 'shareText'), url };\n      try {\n        if (navigator.share) {\n          await navigator.share(payload);\n          return;\n        }\n        if (navigator.clipboard?.writeText) {\n          await navigator.clipboard.writeText(url);\n          showToast(t(lang, 'linkCopied'));\n          return;\n        }\n        window.prompt(t(lang, 'shareApp'), url);\n      } catch (e) {\n        if (e?.name === 'AbortError') return;\n        try {\n          await navigator.clipboard?.writeText?.(url);\n          showToast(t(lang, 'linkCopied'));\n        } catch {\n          window.prompt(t(lang, 'shareApp'), url);\n        }\n      }\n    };\n\n    return ("
)

# Replace mode card with dense mode + legs/sets + share row.
old_mode = """        {/* Režim */}
        <div className=\"lobbyCard\">
          <div className=\"lobbyControls\">
            <span>{t(lang, 'mode')}</span>
            <ThemedSelect
              className=\"input\"
              value={mode}
              onChange={e => setMode(e.target.value)}
              style={{ height: 34 }}
            >
              <option value=\"classic\">{t(lang, 'classic')}</option>
              <option value=\"cricket\">{t(lang, 'cricket')}</option>
              <option value=\"around\">{t(lang, 'around')}</option>
              <option value=\"roulette\">{t(lang, 'roulette')}</option>
              <option value=\"rouletteDouble\">{t(lang, 'rouletteDouble')}</option>
            </ThemedSelect>
          </div>
        </div>"""
new_mode = """        {/* Režim + zápasový formát + sdílení v jednom kompaktním řádku */}
        <div className=\"lobbyCard\">
          <div className=\"lobbyControls lobbyModeRow\">
            <div className=\"lobbyModeGroup\">
              <span>{t(lang, 'mode')}</span>
              <ThemedSelect
                className=\"input\"
                value={mode}
                onChange={e => setMode(e.target.value)}
                style={{ height: 34 }}
              >
                <option value=\"classic\">{t(lang, 'classic')}</option>
                <option value=\"cricket\">{t(lang, 'cricket')}</option>
                <option value=\"around\">{t(lang, 'around')}</option>
                <option value=\"roulette\">{t(lang, 'roulette')}</option>
                <option value=\"rouletteDouble\">{t(lang, 'rouletteDouble')}</option>
              </ThemedSelect>
            </div>

            {mode === 'classic' && (
              <div className=\"matchFormatControls\">
                <label className=\"matchFormatItem\">
                  <span>{t(lang, 'legs')}</span>
                  <ThemedSelect className=\"input matchCountSelect\" value={legsToWinSet} onChange={e => setLegsToWinSet(Number(e.target.value))}>
                    {matchOptions.map(n => <option key={`legs-${n}`} value={n}>{n}</option>)}
                  </ThemedSelect>
                </label>
                <label className=\"matchFormatItem\">
                  <span>{t(lang, 'sets')}</span>
                  <ThemedSelect className=\"input matchCountSelect\" value={setsToWin} onChange={e => setSetsToWin(Number(e.target.value))}>
                    {matchOptions.map(n => <option key={`sets-${n}`} value={n}>{n}</option>)}
                  </ThemedSelect>
                </label>
              </div>
            )}

            <button type=\"button\" className=\"shareIconBtn\" onClick={shareApp} title={t(lang, 'shareApp')} aria-label={t(lang, 'shareApp')}>
              <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">
                <circle cx=\"18\" cy=\"5\" r=\"2.5\" />
                <circle cx=\"6\" cy=\"12\" r=\"2.5\" />
                <circle cx=\"18\" cy=\"19\" r=\"2.5\" />
                <path d=\"M8.2 10.9 15.8 6.2M8.2 13.1l7.6 4.7\" />
              </svg>
            </button>
          </div>
        </div>"""
rep(old_mode, new_mode)

# Game signature
rep(
"    lang, t, mode, playerMode, scoreInputMode, isPremium, classicOutShortLabel,\n    players, order, currIdx,",
"    lang, t, mode, playerMode, scoreInputMode, isPremium, classicOutShortLabel,\n    legsToWinSet, setsToWin, classicLegsWon, classicSetsWon,\n    players, order, currIdx,"
)

# Team progress in title line
rep(
"                    <div className=\"playerHeader\">\n                      <div className=\"playerNameText\">{teamName}</div>\n\n                      <div className=\"playerStats\">",
"                    <div className=\"playerHeader\">\n                      <div className=\"playerTitleLine\">\n                        <div className=\"playerNameText\">{teamName}</div>\n                        <div className=\"classicMatchProgress\">\n                          {t(lang, 'sets')} {classicSetsWon?.[teamIdx] || 0}/{setsToWin} · {t(lang, 'legs')} {classicLegsWon?.[teamIdx] || 0}/{legsToWinSet}\n                        </div>\n                      </div>\n\n                      <div className=\"playerStats\">"
)

# Individual Classic progress; leave Around untouched via conditional wrapper.
rep(
"                  <div className=\"playerHeader\">\n                    <div className=\"playerNameText\">{p.name}</div>\n\n                    {mode === 'classic' ? (",
"                  <div className=\"playerHeader\">\n                    <div className=\"playerTitleLine\">\n                      <div className=\"playerNameText\">{p.name}</div>\n                      {mode === 'classic' && (\n                        <div className=\"classicMatchProgress\">\n                          {t(lang, 'sets')} {classicSetsWon?.[pIdx] || 0}/{setsToWin} · {t(lang, 'legs')} {classicLegsWon?.[pIdx] || 0}/{legsToWinSet}\n                        </div>\n                      )}\n                    </div>\n\n                    {mode === 'classic' ? ("
)

APP.write_text(app, encoding='utf-8')

# ---- CSS ----
css += """

/* === CLASSIC SETS / LEGS + SHARE === */
.lobbyModeRow{
  display:flex;
  align-items:center;
  gap:8px;
  width:100%;
  flex-wrap:wrap;
}
.lobbyModeGroup,
.matchFormatControls,
.matchFormatItem{
  display:flex;
  align-items:center;
  gap:6px;
}
.matchFormatControls{
  margin-left:auto;
  flex-wrap:wrap;
}
.matchFormatItem{
  color:#fff;
  font-weight:800;
  font-size:13px;
}
.matchCountSelect{
  min-width:58px;
  height:34px;
  padding-left:8px;
  padding-right:8px;
}
.shareIconBtn{
  width:36px;
  height:34px;
  margin-left:2px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border:1px solid var(--accent);
  border-radius:9px;
  background:#171a1f;
  color:var(--accent);
  padding:0;
  cursor:pointer;
  flex:0 0 auto;
}
.shareIconBtn svg{
  width:21px;
  height:21px;
  fill:currentColor;
  stroke:currentColor;
  stroke-width:1.8;
  stroke-linecap:round;
}
.shareIconBtn svg path{ fill:none; }
.playerTitleLine{
  display:flex;
  align-items:baseline;
  gap:8px;
  min-width:0;
  flex-wrap:wrap;
}
.classicMatchProgress{
  color:var(--accent);
  font-size:12px;
  line-height:1.1;
  font-weight:900;
  white-space:nowrap;
}
@media (max-width:520px){
  .matchFormatControls{
    margin-left:0;
  }
  .lobbyModeGroup{ flex:1 1 auto; }
  .shareIconBtn{ margin-left:auto; }
}
"""
CSS.write_text(css, encoding='utf-8')
print('sets/legs/share patch applied')
