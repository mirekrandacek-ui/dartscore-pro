import { botThrowAround, botThrowClassic, botThrowCricket } from '../src/botEngine.js';

const LEVELS = ['beginner', 'medium', 'hard'];

const mulberry32 = seed => () => {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const mean = xs => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const percentile = (xs, q) => {
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.max(0, Math.floor((a.length - 1) * q)))];
};

function playClassic(level, seed, keepVisits = false) {
  const rng = mulberry32(seed);
  let score = 501;
  let darts = 0;
  let t20 = 0;
  const visits = [];
  const rules = { double: true, triple: false, master: false };
  const form = 0.94 + rng() * 0.12;

  while (score > 0 && darts < 240) {
    const turnStart = score;
    const visit = [];
    for (let d = 0; d < 3 && score > 0; d += 1) {
      const hit = botThrowClassic({ score, dartsLeft: 3 - d, rules, level, form, rng });
      const points = hit.v * hit.m;
      darts += 1;
      if (hit.v === 20 && hit.m === 3) t20 += 1;
      visit.push(hit.m === 3 ? `T${hit.v}` : hit.m === 2 ? `D${hit.v}` : String(hit.v));

      const tentative = score - points;
      const validFinish = hit.m === 2 || hit.v === 50;
      if (tentative < 0 || tentative === 1 || (tentative === 0 && !validFinish)) {
        score = turnStart;
        break;
      }
      score = tentative;
    }
    if (keepVisits) visits.push(visit.join(' · '));
  }

  return { darts, t20, visits, finished: score === 0 };
}

const cricketKey = v => v === 25 ? 'bull' : String(v);
function playCricketClosure(level, seed) {
  const rng = mulberry32(seed);
  const blankMarks = { '20': 0, '19': 0, '18': 0, '17': 0, '16': 0, '15': 0, bull: 0 };
  const cricket = [
    { marks: { ...blankMarks }, score: 0 },
    { marks: { ...blankMarks }, score: 0 },
  ];
  const form = 0.94 + rng() * 0.12;
  let darts = 0;

  const closed = () => [20, 19, 18, 17, 16, 15, 25].every(v => cricket[0].marks[cricketKey(v)] >= 3);
  while (!closed() && darts < 240) {
    const hit = botThrowCricket({ cricket, pIdx: 0, level, form, rng });
    darts += 1;
    if ([15, 16, 17, 18, 19, 20, 25].includes(hit.v)) {
      const key = cricketKey(hit.v);
      cricket[0].marks[key] = Math.min(3, cricket[0].marks[key] + hit.m);
    }
  }
  return darts;
}

function playAround(level, seed) {
  const rng = mulberry32(seed);
  const form = 0.94 + rng() * 0.12;
  let next = 1;
  let darts = 0;
  while (next <= 25 && darts < 240) {
    const hit = botThrowAround({ next, level, form, rng });
    darts += 1;
    if (next <= 20 && hit.v === next) next += 1;
    else if (next === 21 && hit.v === 25) next = 26;
    if (next === 21) next = 25;
  }
  return darts;
}

const classic = {};
const cricket = {};
const around = {};

for (const [li, level] of LEVELS.entries()) {
  const classicRuns = Array.from({ length: 3000 }, (_, i) => playClassic(level, 100000 * (li + 1) + i));
  if (classicRuns.some(x => !x.finished)) throw new Error(`${level}: unfinished Classic simulation`);
  const darts = classicRuns.map(x => x.darts);
  const t20s = classicRuns.map(x => x.t20);
  classic[level] = {
    meanDarts: mean(darts),
    p10: percentile(darts, 0.10),
    p90: percentile(darts, 0.90),
    matchAvg3: 501 / mean(darts) * 3,
    t20PerLeg: mean(t20s),
    zeroT20Share: t20s.filter(x => x === 0).length / t20s.length,
  };

  const cricketRuns = Array.from({ length: 1500 }, (_, i) => playCricketClosure(level, 200000 * (li + 1) + i));
  cricket[level] = { meanDarts: mean(cricketRuns), p10: percentile(cricketRuns, 0.10), p90: percentile(cricketRuns, 0.90) };

  const aroundRuns = Array.from({ length: 1500 }, (_, i) => playAround(level, 300000 * (li + 1) + i));
  around[level] = { meanDarts: mean(aroundRuns), p10: percentile(aroundRuns, 0.10), p90: percentile(aroundRuns, 0.90) };
}

const assert = (ok, message) => { if (!ok) throw new Error(message); };
assert(classic.beginner.meanDarts > classic.medium.meanDarts && classic.medium.meanDarts > classic.hard.meanDarts, 'Classic difficulty ordering broken');
assert(classic.beginner.meanDarts >= 55 && classic.beginner.meanDarts <= 95, 'Beginner Classic pace unrealistic');
assert(classic.medium.meanDarts >= 35 && classic.medium.meanDarts <= 65, 'Medium Classic pace unrealistic');
assert(classic.hard.meanDarts >= 25 && classic.hard.meanDarts <= 48, 'Hard Classic pace unrealistic');
assert(classic.beginner.t20PerLeg < 0.5 && classic.beginner.zeroT20Share > 0.70, 'Beginner hits T20 too often');
assert(classic.medium.t20PerLeg > 0.4 && classic.medium.t20PerLeg < 3.0, 'Medium T20 frequency unrealistic');
assert(classic.hard.t20PerLeg > 1.2 && classic.hard.t20PerLeg < 6.0, 'Hard T20 frequency unrealistic');
assert(cricket.beginner.meanDarts > cricket.medium.meanDarts && cricket.medium.meanDarts > cricket.hard.meanDarts, 'Cricket difficulty ordering broken');
assert(around.beginner.meanDarts > around.medium.meanDarts && around.medium.meanDarts > around.hard.meanDarts, 'Around difficulty ordering broken');

console.log('\n=== REALISTIC BOT SIMULATION ===');
for (const level of LEVELS) {
  const c = classic[level];
  console.log(`${level.padEnd(9)} Classic 501 DO: mean ${c.meanDarts.toFixed(1)} darts, p10–p90 ${c.p10}–${c.p90}, match avg ${c.matchAvg3.toFixed(1)}, T20/leg ${c.t20PerLeg.toFixed(2)}, no-T20 legs ${(c.zeroT20Share * 100).toFixed(0)}%`);
  console.log(`${' '.repeat(9)} Cricket close: mean ${cricket[level].meanDarts.toFixed(1)} darts (${cricket[level].p10}–${cricket[level].p90})`);
  console.log(`${' '.repeat(9)} Around: mean ${around[level].meanDarts.toFixed(1)} darts (${around[level].p10}–${around[level].p90})`);
}

console.log('\n=== SAMPLE PUB FLOW (first 10 visits, same seed) ===');
for (const [li, level] of LEVELS.entries()) {
  const sample = playClassic(level, 99000 + li, true);
  console.log(`${level}: ${sample.visits.slice(0, 10).join(' | ')}`);
}
