from pathlib import Path

p = Path('src/App.jsx')
s = p.read_text(encoding='utf-8')

# 1) Classic crash: compute the short out label in the game-render scope.
anchor = "    const cricketTargets = ['15', '16', '17', '18', '19', '20', 'bull'];\n"
insert = """    const classicOutShortLabel = (() => {\n      const rules = [];\n      if (outDouble) rules.push('DOUBLE-OUT');\n      if (outTriple) rules.push('TRIPLE-OUT');\n      if (outMaster) rules.push('MASTER-OUT');\n      return rules.length ? rules.join(' + ') : 'ANY-OUT';\n    })();\n\n"""
if insert not in s:
    if anchor not in s:
        raise SystemExit('classic anchor not found')
    s = s.replace(anchor, insert + anchor, 1)

# 2) Roulette compact header: show only round count; target stays in player target box.
old = """            {(mode === 'roulette' || mode === 'rouletteDouble') && (\n              <span className=\"gameTopInfo\">\n                {`${t(lang, 'target')}: ${rouletteTargetLabel(roulette?.currentTargets?.[order[currIdx]])} • ${Math.min(Math.floor(((thrown[order[currIdx]] || 0) / 3)) + 1, roulette?.maxRounds ?? 8)}/${roulette?.maxRounds ?? 8}`}\n              </span>\n            )}\n"""
new = """            {(mode === 'roulette' || mode === 'rouletteDouble') && (\n              <span className=\"gameTopInfo\">\n                {`${t(lang, 'roundCount')}: ${Math.min(Math.floor(((thrown[order[currIdx]] || 0) / 3)) + 1, roulette?.maxRounds ?? 8)}/${roulette?.maxRounds ?? 8}`}\n              </span>\n            )}\n"""
if old not in s:
    raise SystemExit('roulette header block not found')
s = s.replace(old, new, 1)

# Add localized roundCount text next to roulette labels in every language block.
repls = {
    "    rouletteTotalPoints: 'Body celkem',\n": "    rouletteTotalPoints: 'Body celkem', roundCount: 'Počet kol',\n",
    "    rouletteTotalPoints: 'Total points',\n": "    rouletteTotalPoints: 'Total points', roundCount: 'Rounds',\n",
    "    rouletteTotalPoints: 'Punkte gesamt',\n": "    rouletteTotalPoints: 'Punkte gesamt', roundCount: 'Runden',\n",
    "    rouletteTotalPoints: 'Puntos totales',\n": "    rouletteTotalPoints: 'Puntos totales', roundCount: 'Rondas',\n",
    "    rouletteTotalPoints: 'Totaal punten',\n": "    rouletteTotalPoints: 'Totaal punten', roundCount: 'Rondes',\n",
    "    rouletteTotalPoints: 'Всего очков',\n": "    rouletteTotalPoints: 'Всего очков', roundCount: 'Раунды',\n",
    "    rouletteTotalPoints: '总分',\n": "    rouletteTotalPoints: '总分', roundCount: '轮数',\n",
}
for old_t, new_t in repls.items():
    if old_t not in s:
        raise SystemExit(f'translation anchor missing: {old_t!r}')
    s = s.replace(old_t, new_t, 1)

p.write_text(s, encoding='utf-8')
