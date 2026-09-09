from pathlib import Path

p = Path('src/App.jsx')
s = p.read_text(encoding='utf-8')

# Pass the already-computed Classic finish label into the Game component.
old_sig = "    lang, t, mode, playerMode, scoreInputMode, isPremium,\n"
new_sig = "    lang, t, mode, playerMode, scoreInputMode, isPremium, classicOutShortLabel,\n"
if old_sig not in s:
    raise SystemExit('Game signature anchor not found')
s = s.replace(old_sig, new_sig, 1)

old_call = "    isPremium={isPremium}\n    players={players}\n"
new_call = "    isPremium={isPremium}\n    classicOutShortLabel={classicOutShortLabel}\n    players={players}\n"
if old_call not in s:
    raise SystemExit('Game call anchor not found')
s = s.replace(old_call, new_call, 1)

# Roulette header: target is already visible in the player's target box, show only round count.
old_header = """            {(mode === 'roulette' || mode === 'rouletteDouble') && (\n              <span className=\"gameTopInfo\">\n                {`${t(lang, 'target')}: ${rouletteTargetLabel(roulette?.currentTargets?.[order[currIdx]])} • ${Math.min(Math.floor(((thrown[order[currIdx]] || 0) / 3)) + 1, roulette?.maxRounds ?? 8)}/${roulette?.maxRounds ?? 8}`}\n              </span>\n            )}\n"""
new_header = """            {(mode === 'roulette' || mode === 'rouletteDouble') && (\n              <span className=\"gameTopInfo\">\n                {`${t(lang, 'roundCount')}: ${Math.min(Math.floor(((thrown[order[currIdx]] || 0) / 3)) + 1, roulette?.maxRounds ?? 8)}/${roulette?.maxRounds ?? 8}`}\n              </span>\n            )}\n"""
if old_header not in s:
    raise SystemExit('Roulette compact header anchor not found')
s = s.replace(old_header, new_header, 1)

translations = {
    "    rouletteTotalPoints: 'Body celkem',\n": "    rouletteTotalPoints: 'Body celkem', roundCount: 'Počet kol',\n",
    "    rouletteTotalPoints: 'Total points',\n": "    rouletteTotalPoints: 'Total points', roundCount: 'Rounds',\n",
    "    rouletteTotalPoints: 'Punkte gesamt',\n": "    rouletteTotalPoints: 'Punkte gesamt', roundCount: 'Runden',\n",
    "    rouletteTotalPoints: 'Puntos totales',\n": "    rouletteTotalPoints: 'Puntos totales', roundCount: 'Rondas',\n",
    "    rouletteTotalPoints: 'Totaal punten',\n": "    rouletteTotalPoints: 'Totaal punten', roundCount: 'Rondes',\n",
    "    rouletteTotalPoints: 'Всего очков',\n": "    rouletteTotalPoints: 'Всего очков', roundCount: 'Раунды',\n",
    "    rouletteTotalPoints: '总分',\n": "    rouletteTotalPoints: '总分', roundCount: '轮数',\n",
}
for old, new in translations.items():
    if old not in s:
        raise SystemExit(f'Missing translation anchor: {old!r}')
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
