from pathlib import Path

path = Path('src/botEngine.js')
engine = path.read_text(encoding='utf-8')

replacements = [
    (
        "  beginner: {\n    doubleHit: 0.07,\n    tripleHit: 0.012,",
        "  beginner: {\n    doubleHit: 0.08,\n    tripleHit: 0.012,",
    ),
    (
        "  hard: {\n    doubleHit: 0.27,\n    tripleHit: 0.13,",
        "  hard: {\n    doubleHit: 0.27,\n    tripleHit: 0.16,",
    ),
]

for old, new in replacements:
    if old not in engine:
        raise SystemExit(f'bot tuning anchor missing: {old!r}')
    engine = engine.replace(old, new, 1)

path.write_text(engine, encoding='utf-8')
print('realistic bot difficulty tuning applied')
