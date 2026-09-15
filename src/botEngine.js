// Realistic pub-player bot engine for DartScore Pro.
// The goal is believable play, not mathematically optimal darts.

export const BOT_LEVEL_NAMES = ['beginner', 'medium', 'hard'];

export const normalizeBotLevel = (level) => {
  if (level === 'easy') return 'beginner';
  if (level === 'expert') return 'hard';
  return BOT_LEVEL_NAMES.includes(level) ? level : 'beginner';
};

const BOARD = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const DOUBLE_PREF = [20, 16, 18, 12, 10, 8, 6, 4, 2, 1, 14, 15, 17, 19, 13, 11, 9, 7, 5, 3];

const PROFILES = {
  beginner: {
    doubleHit: 0.07,
    tripleHit: 0.012,
    singleHit: 0.36,
    singleNeighbor: 0.28,
    singleRandom: 0.26,
    tripleSingle: 0.36,
    tripleNeighbor: 0.28,
    tripleRandom: 0.22,
    checkoutAwareness: 60,
    bull50Hit: 0.035,
    bull25Hit: 0.10,
    cricketHit: 0.33,
    cricketFocus: 0.55,
    cricketMarks: [0.91, 0.07, 0.02],
    aroundHit: 0.30,
    aroundBullHit: 0.18,
  },
  medium: {
    doubleHit: 0.15,
    tripleHit: 0.055,
    singleHit: 0.55,
    singleNeighbor: 0.25,
    singleRandom: 0.15,
    tripleSingle: 0.43,
    tripleNeighbor: 0.25,
    tripleRandom: 0.20,
    checkoutAwareness: 110,
    bull50Hit: 0.085,
    bull25Hit: 0.20,
    cricketHit: 0.52,
    cricketFocus: 0.75,
    cricketMarks: [0.78, 0.15, 0.07],
    aroundHit: 0.52,
    aroundBullHit: 0.34,
  },
  hard: {
    doubleHit: 0.27,
    tripleHit: 0.13,
    singleHit: 0.72,
    singleNeighbor: 0.18,
    singleRandom: 0.08,
    tripleSingle: 0.50,
    tripleNeighbor: 0.22,
    tripleRandom: 0.08,
    checkoutAwareness: 170,
    bull50Hit: 0.16,
    bull25Hit: 0.32,
    cricketHit: 0.68,
    cricketFocus: 0.88,
    cricketMarks: [0.66, 0.20, 0.14],
    aroundHit: 0.70,
    aroundBullHit: 0.52,
  },
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const chanceWithForm = (chance, form = 1) => clamp(chance / Math.max(0.85, Math.min(1.15, form)), 0, 0.95);

const pick = (items, rng = Math.random) => items[Math.floor(rng() * items.length) % items.length];

const weighted = (entries, rng = Math.random) => {
  const total = entries.reduce((sum, x) => sum + x.weight, 0);
  let r = rng() * total;
  for (const entry of entries) {
    r -= entry.weight;
    if (r <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
};

const neighbors = (v) => {
  const ix = BOARD.indexOf(v);
  if (ix < 0) return [1, 5];
  return [BOARD[(ix + BOARD.length - 1) % BOARD.length], BOARD[(ix + 1) % BOARD.length]];
};

const randomSingle = (rng) => ({ v: pick(BOARD, rng), m: 1 });

const resolveAim = (aim, rawLevel, form = 1, rng = Math.random) => {
  const level = normalizeBotLevel(rawLevel);
  const p = PROFILES[level];
  const v = Number(aim?.v) || 0;
  const m = Number(aim?.m) || 1;
  const r = rng();

  if (v === 25 || v === 50) {
    const exact = chanceWithForm(v === 50 ? p.bull50Hit : p.bull25Hit, form);
    if (r < exact) return { v, m: 1 };
    if (r < exact + 0.20) return { v: 25, m: 1 };
    if (r < exact + 0.70) return randomSingle(rng);
    return { v: 0, m: 1 };
  }

  const [left, right] = neighbors(v);

  if (m === 2) {
    const exact = chanceWithForm(p.doubleHit, form);
    if (r < exact) return { v, m: 2 };
    if (r < exact + 0.45) return { v, m: 1 };
    if (r < exact + 0.70) return { v: pick([left, right], rng), m: 1 };
    if (r < exact + 0.86) return randomSingle(rng);
    return { v: 0, m: 1 };
  }

  if (m === 3) {
    const exact = chanceWithForm(p.tripleHit, form);
    if (r < exact) return { v, m: 3 };
    if (r < exact + p.tripleSingle) return { v, m: 1 };
    if (r < exact + p.tripleSingle + p.tripleNeighbor) return { v: pick([left, right], rng), m: 1 };
    if (r < exact + p.tripleSingle + p.tripleNeighbor + p.tripleRandom) return randomSingle(rng);
    return { v: 0, m: 1 };
  }

  const exact = chanceWithForm(p.singleHit, form);
  if (r < exact) {
    const accidentalTreble = level === 'beginner' ? 0.003 : level === 'medium' ? 0.01 : 0.015;
    return { v, m: rng() < accidentalTreble ? 3 : 1 };
  }
  if (r < exact + p.singleNeighbor) return { v: pick([left, right], rng), m: 1 };
  if (r < exact + p.singleNeighbor + p.singleRandom) return randomSingle(rng);
  return { v: 0, m: 1 };
};

const scoringAim = (rawLevel, rng = Math.random) => {
  const level = normalizeBotLevel(rawLevel);
  if (level === 'beginner') {
    return weighted([
      { value: { v: 20, m: 1 }, weight: 50 },
      { value: { v: 19, m: 1 }, weight: 18 },
      { value: { v: 18, m: 1 }, weight: 14 },
      { value: { v: pick([15, 16, 17], rng), m: 1 }, weight: 10 },
      { value: { v: 20, m: 3 }, weight: 8 },
    ], rng);
  }
  if (level === 'medium') {
    return weighted([
      { value: { v: 20, m: 3 }, weight: 62 },
      { value: { v: 19, m: 3 }, weight: 16 },
      { value: { v: 18, m: 3 }, weight: 10 },
      { value: { v: 20, m: 1 }, weight: 12 },
    ], rng);
  }
  return weighted([
    { value: { v: 20, m: 3 }, weight: 72 },
    { value: { v: 19, m: 3 }, weight: 14 },
    { value: { v: 18, m: 3 }, weight: 8 },
    { value: { v: 20, m: 1 }, weight: 6 },
  ], rng);
};

const BOT_TARGETS = [
  ...Array.from({ length: 20 }, (_, i) => ({ v: 20 - i, m: 1 })),
  ...DOUBLE_PREF.map(v => ({ v, m: 2 })),
  ...Array.from({ length: 20 }, (_, i) => ({ v: 20 - i, m: 3 })),
  { v: 25, m: 1 },
  { v: 50, m: 1 },
];

const checkoutAim = (score, dartsLeft, rules = {}) => {
  const restricted = Boolean(rules.double || rules.triple || rules.master);
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
    if (!memo.has(key)) {
      memo.set(key, BOT_TARGETS.some(t => {
        const rest = n - t.v * t.m;
        return safe(rest) && canFinish(rest, left - 1);
      }));
    }
    return memo.get(key);
  };

  if (dartsLeft > 1 && score <= dartsLeft * 60) {
    const setup = BOT_TARGETS.find(t => {
      const rest = score - t.v * t.m;
      return safe(rest) && canFinish(rest, dartsLeft - 1);
    });
    if (setup) return setup;
  }

  for (const final of finals) {
    const setup = BOT_TARGETS.find(t => t.m === 1 && t.v <= 20 && score - t.v === final.v * final.m);
    if (setup) return setup;
  }

  return BOT_TARGETS.find(t => t.m === 1 && safe(score - t.v)) || { v: 1, m: 1 };
};

export const botThrowClassic = ({ score, dartsLeft = 3, rules = {}, level = 'beginner', form = 1, rng = Math.random }) => {
  const normalized = normalizeBotLevel(level);
  const profile = PROFILES[normalized];
  const numericScore = Number(score) || 0;
  const aim = numericScore > 0 && numericScore <= profile.checkoutAwareness
    ? checkoutAim(numericScore, dartsLeft, rules)
    : scoringAim(normalized, rng);
  return resolveAim(aim, normalized, form, rng);
};

const cricketKey = (v) => v === 25 ? 'bull' : String(v);

const cricketTarget = (cricket, pIdx, rawLevel, rng = Math.random) => {
  const level = normalizeBotLevel(rawLevel);
  const p = PROFILES[level];
  const values = [20, 19, 18, 17, 16, 15, 25];
  const own = cricket?.[pIdx];
  const unfinished = values.filter(v => (own?.marks?.[cricketKey(v)] ?? 0) < 3);

  if (unfinished.length) {
    if (rng() < p.cricketFocus) return unfinished[0];
    return pick(unfinished, rng);
  }

  const scorable = values.filter(v =>
    (own?.marks?.[cricketKey(v)] ?? 0) >= 3 &&
    cricket?.some((pl, ix) => ix !== pIdx && (pl?.marks?.[cricketKey(v)] ?? 0) < 3)
  );
  return scorable[0] ?? 20;
};

export const botThrowCricket = ({ cricket, pIdx, level = 'beginner', form = 1, rng = Math.random }) => {
  const normalized = normalizeBotLevel(level);
  const p = PROFILES[normalized];
  const target = cricketTarget(cricket, pIdx, normalized, rng);
  const baseHit = target === 25 ? p.cricketHit * 0.78 : p.cricketHit;
  const hit = chanceWithForm(baseHit, form);

  if (rng() >= hit) {
    const spillChance = normalized === 'beginner' ? 0.08 : normalized === 'medium' ? 0.10 : 0.12;
    if (rng() < spillChance) {
      const other = pick([20, 19, 18, 17, 16, 15].filter(v => v !== target), rng);
      return { v: other, m: 1 };
    }
    return { v: 0, m: 1 };
  }

  const [singleWeight, doubleWeight, tripleWeight] = p.cricketMarks;
  let marks = weighted([
    { value: 1, weight: singleWeight },
    { value: 2, weight: doubleWeight },
    { value: 3, weight: tripleWeight },
  ], rng);
  if (target === 25 && marks > 2) marks = 2;
  return { v: target, m: marks };
};

export const botThrowAround = ({ next, level = 'beginner', form = 1, rng = Math.random }) => {
  const normalized = normalizeBotLevel(level);
  const p = PROFILES[normalized];
  const target = Number(next) > 20 ? 25 : Math.max(1, Number(next) || 1);
  const hitChance = chanceWithForm(target === 25 ? p.aroundBullHit : p.aroundHit, form);

  if (rng() < hitChance) {
    if (target === 25) return { v: 25, m: 1 };
    const ring = normalized === 'beginner'
      ? weighted([{ value: 1, weight: 90 }, { value: 2, weight: 7 }, { value: 3, weight: 3 }], rng)
      : normalized === 'medium'
        ? weighted([{ value: 1, weight: 80 }, { value: 2, weight: 12 }, { value: 3, weight: 8 }], rng)
        : weighted([{ value: 1, weight: 70 }, { value: 2, weight: 15 }, { value: 3, weight: 15 }], rng);
    return { v: target, m: ring };
  }

  if (target === 25) {
    return rng() < 0.12 ? { v: 0, m: 1 } : randomSingle(rng);
  }
  const [left, right] = neighbors(target);
  return weighted([
    { value: { v: left, m: 1 }, weight: 35 },
    { value: { v: right, m: 1 }, weight: 35 },
    { value: randomSingle(rng), weight: 20 },
    { value: { v: 0, m: 1 }, weight: 10 },
  ], rng);
};

export const BOT_PROFILE_SUMMARY = {
  beginner: { classic501Darts: '60–90', avg3: '18–32', doublePct: '5–8%', t20: 'very rare' },
  medium: { classic501Darts: '40–60', avg3: '35–50', doublePct: '12–18%', t20: 'occasional' },
  hard: { classic501Darts: '30–45', avg3: '50–65', doublePct: '22–32%', t20: 'regular, not constant' },
};
