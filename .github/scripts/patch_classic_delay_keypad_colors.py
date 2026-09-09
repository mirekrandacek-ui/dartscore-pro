from pathlib import Path

app_path = Path('src/App.jsx')
css_path = Path('src/app.css')
app = app_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

# Classic only: keep the third dart visible for half a second before switching player.
start = app.index('  const commitClassic = (value, mOverride) => {')
end = app.index('  const commitClassicRound = (roundScore) => {', start)
classic = app[start:end]

old_guard = """  const commitClassic = (value, mOverride) => {\n    let v = value;\n    let m = (mOverride ?? mult);\n"""
new_guard = """  const commitClassic = (value, mOverride) => {\n    if (darts.length >= 3) return;\n\n    let v = value;\n    let m = (mOverride ?? mult);\n"""
if old_guard not in classic:
    raise SystemExit('Classic guard anchor not found')
classic = classic.replace(old_guard, new_guard, 1)

old_advance = """    const advanceTurn = () => {\n      // žádný scheduleNextPlayer – ať to nepadá, přepnutí je tady vždy definované\n      setTimeout(() => {\n        try { nextPlayer(); } catch (e) { console.error('nextPlayer failed:', e); }\n      }, 250);\n    };\n"""
new_advance = """    const advanceTurn = (delay = 250) => {\n      // žádný scheduleNextPlayer – ať to nepadá, přepnutí je tady vždy definované\n      setTimeout(() => {\n        try { nextPlayer(); } catch (e) { console.error('nextPlayer failed:', e); }\n      }, delay);\n    };\n"""
if old_advance not in classic:
    raise SystemExit('Classic advanceTurn anchor not found')
classic = classic.replace(old_advance, new_advance, 1)

old_third = """      if (nd.length >= 3) {\n        speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);\n        advanceTurn();\n        return [];\n      }\n"""
new_third = """      if (nd.length >= 3) {\n        speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);\n        advanceTurn(500);\n        return nd;\n      }\n"""
if old_third not in classic:
    raise SystemExit('Classic third-dart anchor not found')
classic = classic.replace(old_third, new_third, 1)

app = app[:start] + classic + app[end:]

# Fixed keypad colors using the exact roulette blue/yellow palette.
marker = '/* === FIXED KEYPAD ACTION COLORS === */'
block = r'''

/* === FIXED KEYPAD ACTION COLORS === */
.padPane.dartKeypad .multBtn.mult-2{
  background:linear-gradient(180deg,#fde047,#eab308) !important;
  border-color:#facc15 !important;
  color:#171717 !important;
}
.padPane.dartKeypad .multBtn.mult-3{
  background:linear-gradient(180deg,#3b82f6,#1d4ed8) !important;
  border-color:#60a5fa !important;
  color:#fff !important;
}
.padPane.dartKeypad .multBtn.backspace{
  background:linear-gradient(180deg,#ef4444,#b91c1c) !important;
  border-color:#f87171 !important;
  color:#fff !important;
}
.padPane.dartKeypad .multBtn.mult-2.active,
.padPane.dartKeypad .multBtn.mult-3.active{
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.8) !important;
}
'''
if marker in css:
    raise SystemExit('Keypad color block already exists')
css += block

app_path.write_text(app, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
