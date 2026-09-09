from pathlib import Path

app_path = Path('src/App.jsx')
css_path = Path('src/app.css')
app = app_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

old_header_controls = '''            {/* 2. řádek: lobby = jazyk + hodnocení, hra = název režimu */}
            <div
              className="controls"
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 8,
                width: '100%'
              }}
            >
              {screen === 'lobby' ? (
                <ThemedSelect
                className="input"
                value={lang}
                onChange={e => setLang(e.target.value)}
                style={{
                  height: 44,
                  minWidth: 150,
                  flex: '0 0 auto'
                }}
              >
                {['cs', 'en', 'de', 'es', 'nl', 'ru', 'zh'].map(code => (
                  <option key={code} value={code}>{LANG_LABEL[code]}</option>
                ))}
              </ThemedSelect>
              ) : mode === 'classic' ? (
                <div className="input classicModeInfo">
                  <span className="classicModeTitle">
                    {modeLabel}
                  </span>

                  <span className="classicModeOut">
                    {t(lang, 'outLabel')}: {classicOutShortLabel}
                  </span>
                </div>
              ) : (
                <div
                  className="input"
                  style={{
                    minHeight: 44,
                    flex: '1 1 auto',
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 12px',
                    fontWeight: 800,
                    textAlign: 'center',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)'
                  }}
                >
                  {modeLabel}
                </div>
              )}

              {screen === 'lobby' && (
                <button
                  type="button"
                  className="btn"
                  onClick={rateApp}
                  style={{
                    minHeight: 44,
                    flex: '1 1 auto',
                    minWidth: 0,
                    fontSize: 12,
                    padding: '7px 10px',
                    borderColor: 'var(--accent)',
                    whiteSpace: 'normal',
                    lineHeight: 1.15,
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflowWrap: 'anywhere'
                  }}
                >
                  ⭐ {t(lang, 'rateAppButton')}
                </button>
              )}
            </div>'''

new_header_controls = '''            {/* 2. řádek je jen v lobby. Ve hře šetříme výšku pro hráče. */}
            {screen === 'lobby' && (
              <div
                className="controls"
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 8,
                  width: '100%'
                }}
              >
                <ThemedSelect
                  className="input"
                  value={lang}
                  onChange={e => setLang(e.target.value)}
                  style={{
                    height: 44,
                    minWidth: 150,
                    flex: '0 0 auto'
                  }}
                >
                  {['cs', 'en', 'de', 'es', 'nl', 'ru', 'zh'].map(code => (
                    <option key={code} value={code}>{LANG_LABEL[code]}</option>
                  ))}
                </ThemedSelect>

                <button
                  type="button"
                  className="btn"
                  onClick={rateApp}
                  style={{
                    minHeight: 44,
                    flex: '1 1 auto',
                    minWidth: 0,
                    fontSize: 12,
                    padding: '7px 10px',
                    borderColor: 'var(--accent)',
                    whiteSpace: 'normal',
                    lineHeight: 1.15,
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflowWrap: 'anywhere'
                  }}
                >
                  ⭐ {t(lang, 'rateAppButton')}
                </button>
              </div>
            )}'''

if old_header_controls not in app:
    raise SystemExit('main header controls block not found')
app = app.replace(old_header_controls, new_header_controls, 1)

old_game_top = '''        {/* HORNÍ LIŠTA */}
        <div className="gameTopBar">
          {(mode === 'roulette' || mode === 'rouletteDouble') && (
            <span className="badge">
              {`${t(lang, 'target')}: ${rouletteTargetLabel(roulette?.currentTargets?.[order[currIdx]])} • ${Math.min(Math.floor(((thrown[order[currIdx]] || 0) / 3)) + 1, roulette?.maxRounds ?? 8)}/${roulette?.maxRounds ?? 8}`}
            </span>
          )}

          <div
            className="gameTopBtns"
            style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}
          >
            <button
              type="button"
              className="btn"
              onClick={restartGame}
              style={{ whiteSpace: 'nowrap', minWidth: 80 }}
            >
              {t(lang, 'restart') ?? 'Restart'}
            </button>

            {isPremium && (
              <button
                type="button"
                className="btn"
                onClick={saveGame}
                style={{ whiteSpace: 'nowrap', minWidth: 80 }}
              >
                {t(lang, 'saveGame') ?? 'Uložit hru'}
              </button>
            )}

            <button
              type="button"
              className="btn ghost"
              onClick={() => setScreen('lobby')}
              style={{ whiteSpace: 'nowrap', minWidth: 80 }}
            >
              {t(lang, 'back') ?? 'Zpět'}
            </button>
          </div>
        </div>'''

new_game_top = '''        {/* KOMPAKTNÍ HERNÍ LIŠTA: jen užitečný stav + textové akce */}
        <div className="gameTopBar compactGameTopBar">
          <div className="gameTopStatus">
            {mode === 'classic' && (
              <span className="gameTopInfo">
                {t(lang, 'outLabel')}: {classicOutShortLabel}
              </span>
            )}

            {(mode === 'roulette' || mode === 'rouletteDouble') && (
              <span className="gameTopInfo">
                {`${t(lang, 'target')}: ${rouletteTargetLabel(roulette?.currentTargets?.[order[currIdx]])} • ${Math.min(Math.floor(((thrown[order[currIdx]] || 0) / 3)) + 1, roulette?.maxRounds ?? 8)}/${roulette?.maxRounds ?? 8}`}
              </span>
            )}
          </div>

          <div className="gameTopBtns compactGameActions">
            <button type="button" className="gameTextAction" onClick={restartGame}>
              {t(lang, 'restart') ?? 'Restart'}
            </button>

            {isPremium && (
              <button type="button" className="gameTextAction" onClick={saveGame}>
                {t(lang, 'saveGame') ?? 'Uložit hru'}
              </button>
            )}

            <button type="button" className="gameTextAction" onClick={() => setScreen('lobby')}>
              {t(lang, 'back') ?? 'Zpět'}
            </button>
          </div>
        </div>'''

if old_game_top not in app:
    raise SystemExit('game top bar block not found')
app = app.replace(old_game_top, new_game_top, 1)

css_add = r'''

/* === COMPACT GAME HEADER === */
.container[data-screen="game"] .header{
  gap:0;
  padding-bottom:6px;
}

.compactGameTopBar{
  min-height:32px;
  margin-bottom:4px;
  padding:4px 8px;
  border:1px solid var(--line);
  border-radius:10px;
  background:#171a1f;
  gap:6px 12px;
  flex-wrap:wrap;
}

.gameTopStatus{
  display:flex;
  align-items:center;
  min-width:0;
}

.gameTopInfo{
  color:var(--accent);
  font-size:13px;
  line-height:1.15;
  font-weight:900;
  white-space:nowrap;
}

.compactGameActions{
  display:flex;
  align-items:center;
  gap:0;
  margin-left:auto;
  min-width:0;
}

.gameTextAction{
  appearance:none;
  -webkit-appearance:none;
  border:0;
  background:transparent;
  color:var(--accent);
  padding:2px 7px;
  margin:0;
  font:inherit;
  font-size:13px;
  line-height:1.2;
  font-weight:800;
  cursor:pointer;
  white-space:nowrap;
}

.gameTextAction + .gameTextAction{
  border-left:1px solid var(--line);
}

.gameTextAction:active{
  opacity:.65;
}

/* Cricket měl vlastní starší 12px mezeru. Kompaktní lišta má všude stejnou výšku. */
.container[data-screen="game"][data-mode="cricket"] .compactGameTopBar{
  margin-bottom:4px;
}

@media (max-width:420px){
  .compactGameTopBar{
    padding:4px 6px;
  }
  .gameTopInfo,
  .gameTextAction{
    font-size:12px;
  }
  .gameTextAction{
    padding-left:5px;
    padding-right:5px;
  }
}
'''

if '/* === COMPACT GAME HEADER === */' in css:
    raise SystemExit('compact CSS already present')
css += css_add

app_path.write_text(app, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('compact game header patch applied')
