from pathlib import Path
import re

p = Path('src/App.jsx')
s = p.read_text(encoding='utf-8')

new_bot = r'''const BOT_SCORING_AIMS = {
  beginner: [
    [{ v: 20, m: 1 }, 0.28], [{ v: 19, m: 1 }, 0.16], [{ v: 18, m: 1 }, 0.13],
    [{ v: 17, m: 1 }, 0.11], [{ v: 16, m: 1 }, 0.09], [{ v: 15, m: 1 }, 0.07],
    [{ v: 14, m: 1 }, 0.05], [{ v: 13, m: 1 }, 0.04], [{ v: 12, m: 1 }, 0.04],
    [{ v: 11, m: 1 }, 0.03]
  ],
  easy: [
    [{ v: 20, m: 1 }, 0.60], [{ v: 19, m: 1 }, 0.15], [{ v: 18, m: 1 }, 0.10],
    [{ v: 17, m: 1 }, 0.07], [{ v: 20, m: 3 }, 0.05], [{ v: 16, m: 1 }, 0.03]
  ],
  medium: [
    [{ v: 20, m: 3 }, 0.40], [{ v: 20, m: 1 }, 0.35], [{ v: 19, m: 3 }, 0.10],
    [{ v: 19, m: 1 }, 0.10], [{ v: 18, m: 1 }, 0.05]
  ],
  hard: [
    [{ v: 20, m: 3 }, 0.70], [{ v: 19, m: 3 }, 0.12], [{ v: 20, m: 1 }, 0.12],
    [{ v: 18, m: 3 }, 0.06]
  ],
  expert: [
    [{ v: 20, m: 3 }, 0.88], [{ v: 19, m: 3 }, 0.07], [{ v: 20, m: 1 }, 0.05]
  ]
};
const BOT_CHECKOUT_PLAN_CHANCE = {
  beginner: 0.08,
  easy: 0.22,
  medium: 0.55,
  hard: 0.85,
  expert: 1
};
const botWeightedTarget = (weighted) => {
  const roll = Math.random();
  let acc = 0;
  for (const [target, weight] of weighted) {
    acc += weight;
    if (roll <= acc) return target;
  }
  return weighted[weighted.length - 1][0];
};
const botScoringTarget = (level = 'easy') =>
  botWeightedTarget(BOT_SCORING_AIMS[level] || BOT_SCORING_AIMS.easy);
const botChooseClassic = (score, dartsLeft, rules, level = 'easy') => {
  const restricted = rules.double || rules.triple || rules.master;
  const allowed = ({ v, m }) => !restricted ||
    ((m === 2 || v === 50) && (rules.double || rules.master)) ||
    (m === 3 && (rules.triple || rules.master));
  const finals = BOT_TARGETS.filter(allowed);
  const direct = finals.find(t => t.v * t.m === score);
  if (direct) return direct;
  const safe = n => n > 0 && (!restricted || n !== 1);
  const memo = new Map();
  const canFinish = (n, left) => {
    if (left < 1 || n > left * 60) return false;
    if (finals.some(t => t.v * t.m === n)) return true;
    if (left === 1) return false;
    const key = `${n}:${left}`;
    if (!memo.has(key)) memo.set(key, BOT_TARGETS.some(t => {
      const rest = n - t.v * t.m;
      return safe(rest) && canFinish(rest, left - 1);
    }));
    return memo.get(key);
  };
  const planChance = BOT_CHECKOUT_PLAN_CHANCE[level] ?? BOT_CHECKOUT_PLAN_CHANCE.easy;
  // Lower levels do not calculate professional checkout routes on every visit.
  if (dartsLeft > 1 && score <= dartsLeft * 60 && Math.random() < planChance) {
    const setup = BOT_TARGETS.find(t => safe(score - t.v * t.m) && canFinish(score - t.v * t.m, dartsLeft - 1));
    if (setup) return setup;
  }
  // Scoring phase: each level has its own human-like mix of intended targets.
  if (score > 80) return botScoringTarget(level);
  // Near a finish, stronger bots are more likely to leave a deliberate out.
  if (Math.random() < planChance) {
    for (const final of finals) {
      const setup = BOT_TARGETS.find(t => t.m === 1 && t.v <= 20 && score - t.v === final.v * final.m);
      if (setup) return setup;
    }
  }
  return BOT_TARGETS.find(t => t.m === 1 && safe(score - t.v)) || { v: 1, m: 1 };
};'''

pattern = re.compile(r"const botChooseClassic = \(score, dartsLeft, rules\) => \{.*?\n\};(?=\n\n\n/\* ===== Checkout hint)", re.S)
s2, n = pattern.subn(new_bot, s, count=1)
if n != 1:
    raise SystemExit(f'botChooseClassic replacement count={n}')
s = s2

old_call = """          target = botChooseClassic(scores[scoreIndexForPlayer(pIdx)], 3 - darts.length,\n            { double: outDouble, triple: outTriple, master: outMaster });"""
new_call = """          target = botChooseClassic(scores[scoreIndexForPlayer(pIdx)], 3 - darts.length,\n            { double: outDouble, triple: outTriple, master: outMaster }, p.level);"""
if old_call not in s:
    raise SystemExit('classic bot call anchor not found')
s = s.replace(old_call, new_call, 1)

old_scatter = "        let { v, m } = botScatter(target, p.level, botFormRef.current[p.id]);"
new_scatter = """        let { v, m } = botScatter(target, p.level, botFormRef.current[p.id]);\n        // A true beginner should not repeatedly luck into T20 while simply scoring.\n        if (mode === 'classic' && p.level === 'beginner' && scores[scoreIndexForPlayer(pIdx)] > 80 && v === 20 && m === 3) {\n          m = 1;\n        }"""
if old_scatter not in s:
    raise SystemExit('bot scatter anchor not found')
s = s.replace(old_scatter, new_scatter, 1)

p.write_text(s, encoding='utf-8')
print('final realistic bot flow patch applied')
