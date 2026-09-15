from pathlib import Path
import re

path = Path('src/App.jsx')
app = path.read_text(encoding='utf-8')

# 1) Import the new pure bot engine.
old = "import './app.css';\n"
new = "import './app.css';\nimport { botThrowAround, botThrowClassic, botThrowCricket, normalizeBotLevel } from './botEngine.js';\n"
if old not in app:
    raise SystemExit('app.css import anchor missing')
app = app.replace(old, new, 1)

# 2) Remove the old geometry bot implementation from App.jsx.
pattern = r"\n/\* ===== Robot: target selection is separate from board scatter ===== \*/.*?(?=\n/\* ===== Checkout hint:)"
app, count = re.subn(pattern, "\n", app, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'old bot engine block count={count}')

# 3) Keep only the three agreed levels and migrate old saved labels.
old = "  const [ai, setAi] = useState('off'); // off | easy | medium | hard"
new = "  const [ai, setAi] = useState('off'); // off | beginner | medium | hard"
if old not in app:
    raise SystemExit('AI state anchor missing')
app = app.replace(old, new, 1)

old = "      if (s.ai) setAi(s.ai);"
new = "      if (s.ai) setAi(s.ai === 'off' ? 'off' : normalizeBotLevel(s.ai));"
if old not in app:
    raise SystemExit('saved AI anchor missing')
app = app.replace(old, new, 1)

old = "      if (s.players) setPlayers(s.players.map((p, ix) => ({ ...p, team: p.team || (['A', 'B', 'C'][ix % 3]) })));"
new = "      if (s.players) setPlayers(s.players.map((p, ix) => ({ ...p, level: p.bot ? normalizeBotLevel(p.level) : p.level, team: p.team || (['A', 'B', 'C'][ix % 3]) })));"
if old not in app:
    raise SystemExit('saved players anchor missing')
app = app.replace(old, new, 1)

old = "            level: ai\n"
new = "            level: normalizeBotLevel(ai)\n"
if old not in app:
    raise SystemExit('new bot level anchor missing')
app = app.replace(old, new, 1)

for line in [
    "                  <option value=\"easy\">{t(lang, 'easy')}</option>\n",
    "                  <option value=\"expert\">{t(lang, 'expert')}</option>\n",
]:
    if line not in app:
        raise SystemExit(f'legacy level option missing: {line.strip()}')
    app = app.replace(line, '', 1)

# 4) Replace the runtime bot turn with the realistic mode-specific engine.
pattern = r"    /\* BOT TURN: one cancellable dart, recalculated from the latest state\. \*/.*?\n\s*/\* reklama overlay \*/"
replacement = r'''    /* BOT TURN: one cancellable dart, recalculated from the latest state. */
    const botFormRef = useRef({});
    useEffect(() => {
      botFormRef.current = {};
    }, [screen, classicLegsWon, classicSetsWon]);

    useEffect(() => {
      const pIdx = order[currIdx];
      const p = players[pIdx];
      if (screen !== 'game' || !p?.bot || winner != null || classicLegTransition || darts.length >= 3) return;
      if (mode !== 'classic' && mode !== 'cricket' && mode !== 'around') return;

      const timer = window.setTimeout(() => {
        if (botFormRef.current[p.id] == null) botFormRef.current[p.id] = 0.94 + Math.random() * 0.12;
        const form = botFormRef.current[p.id];
        const level = normalizeBotLevel(p.level);
        let hit;

        if (mode === 'classic') {
          hit = botThrowClassic({
            score: scores[scoreIndexForPlayer(pIdx)],
            dartsLeft: 3 - darts.length,
            rules: { double: outDouble, triple: outTriple, master: outMaster },
            level,
            form,
          });
        } else if (mode === 'cricket') {
          hit = botThrowCricket({ cricket, pIdx, level, form });
        } else {
          hit = botThrowAround({ next: around?.[pIdx]?.next ?? 1, level, form });
        }

        commitDart(hit.v, hit.m);
      }, 800);
      return () => window.clearTimeout(timer);
    }, [screen, currIdx, order, players, winner, mode, scores, darts,
      cricket, around, playerMode, classicLegTransition,
      outDouble, outTriple, outMaster]);

 /* reklama overlay */'''
app, count = re.subn(pattern, replacement, app, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'bot runtime block count={count}')

# Guardrails: old deterministic T20/scatter implementation must be gone.
for forbidden in ['botScatter(', 'botChooseClassic(', "<option value=\"easy\">", "<option value=\"expert\">"]:
    if forbidden in app:
        raise SystemExit(f'forbidden legacy bot code remains: {forbidden}')

for required in [
    "botThrowClassic({",
    "botThrowCricket({ cricket, pIdx, level, form })",
    "botThrowAround({ next: around?.[pIdx]?.next ?? 1, level, form })",
    "<option value=\"beginner\">",
    "<option value=\"medium\">",
    "<option value=\"hard\">",
]:
    if required not in app:
        raise SystemExit(f'required integration missing: {required}')

path.write_text(app, encoding='utf-8')
print('realistic three-level bot integration applied')
