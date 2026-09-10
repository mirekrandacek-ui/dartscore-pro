import fs from 'node:fs';

const path = 'src/App.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(needle, replacement, label) {
  const count = src.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  }
  src = src.replace(needle, replacement);
}

const helper = `
/* ===== Checkout hint: display-only helper, does not alter scoring ===== */
const CHECKOUT_DOUBLE_PREF = [20, 16, 18, 12, 10, 8, 14, 6, 4, 2, 1, 15, 13, 11, 9, 7, 5, 3, 17, 19];
const CHECKOUT_TRIPLE_PREF = Array.from({ length: 20 }, (_, i) => 20 - i);
const CHECKOUT_DARTS = [
  ...CHECKOUT_TRIPLE_PREF.map((v, i) => ({ v, m: 3, score: v * 3, label: 'T' + v, setupRank: i })),
  { v: 50, m: 1, score: 50, label: 'Bull', setupRank: 12 },
  ...Array.from({ length: 20 }, (_, i) => 20 - i).map((v, i) => ({ v, m: 1, score: v, label: String(v), setupRank: 30 + i })),
  { v: 25, m: 1, score: 25, label: '25', setupRank: 42 },
  ...CHECKOUT_DOUBLE_PREF.map((v, i) => ({ v, m: 2, score: v * 2, label: 'D' + v, setupRank: 55 + i }))
];
const checkoutFinishAllowed = (dart, rules) => {
  const restricted = rules.double || rules.triple || rules.master;
  if (!restricted) return true;
  if ((dart.m === 2 || dart.v === 50) && (rules.double || rules.master)) return true;
  if (dart.m === 3 && (rules.triple || rules.master)) return true;
  return false;
};
const checkoutFinishRank = (dart, rules) => {
  if (dart.v === 50) return 2;
  if (dart.m === 2) {
    const ix = CHECKOUT_DOUBLE_PREF.indexOf(dart.v);
    return (ix < 0 ? 25 : ix) * 4;
  }
  if (dart.m === 3) {
    const ix = CHECKOUT_TRIPLE_PREF.indexOf(dart.v);
    return 8 + (ix < 0 ? 25 : ix) * 2;
  }
  if (!rules.double && !rules.triple && !rules.master && dart.m === 1) {
    return 4 + Math.max(0, 20 - dart.v);
  }
  return 100;
};
const checkoutHintCache = new Map();
const getCheckoutHint = (score, dartsLeft, rules = {}) => {
  const target = Number(score);
  const left = Math.min(3, Math.max(0, Number(dartsLeft) || 0));
  if (!Number.isInteger(target) || target <= 0 || left < 1) return '';

  const key = [target, left, rules.double ? 1 : 0, rules.triple ? 1 : 0, rules.master ? 1 : 0].join('|');
  if (checkoutHintCache.has(key)) return checkoutHintCache.get(key);

  const finals = CHECKOUT_DARTS.filter(d => checkoutFinishAllowed(d, rules));
  let best = null;
  let bestCost = Infinity;

  const consider = (route) => {
    const total = route.reduce((sum, d) => sum + d.score, 0);
    if (total !== target) return;
    const final = route[route.length - 1];
    if (!checkoutFinishAllowed(final, rules)) return;
    const setupCost = route.slice(0, -1).reduce((sum, d) => sum + d.setupRank, 0);
    const cost = setupCost + checkoutFinishRank(final, rules);
    if (cost < bestCost) {
      bestCost = cost;
      best = route;
    }
  };

  for (let len = 1; len <= left && !best; len += 1) {
    if (len === 1) {
      finals.forEach(f => consider([f]));
    } else if (len === 2) {
      CHECKOUT_DARTS.forEach(a => {
        const rem = target - a.score;
        if (rem <= 0) return;
        finals.filter(f => f.score === rem).forEach(f => consider([a, f]));
      });
    } else {
      CHECKOUT_DARTS.forEach(a => {
        const remAfterA = target - a.score;
        if (remAfterA <= 0) return;
        CHECKOUT_DARTS.forEach(b => {
          const rem = remAfterA - b.score;
          if (rem <= 0) return;
          finals.filter(f => f.score === rem).forEach(f => consider([a, b, f]));
        });
      });
    }
  }

  const result = best ? best.map(d => d.label).join(' · ') : '';
  checkoutHintCache.set(key, result);
  return result;
};
`;

replaceOnce(
  '\n\n/* ===== Ikona reproduktoru ===== */',
  `\n${helper}\n/* ===== Ikona reproduktoru ===== */`,
  'insert checkout helper'
);

replaceOnce(
  `    classicOutShortLabel={classicOutShortLabel}\n    legsToWinSet={legsToWinSet}`,
  `    classicOutShortLabel={classicOutShortLabel}\n    outDouble={outDouble}\n    outTriple={outTriple}\n    outMaster={outMaster}\n    legsToWinSet={legsToWinSet}`,
  'pass checkout rules to Game'
);

replaceOnce(
  `    lang, t, mode, playerMode, scoreInputMode, isPremium, classicOutShortLabel,\n    legsToWinSet, setsToWin, classicLegsWon, classicSetsWon,`,
  `    lang, t, mode, playerMode, scoreInputMode, isPremium, classicOutShortLabel,\n    outDouble, outTriple, outMaster,\n    legsToWinSet, setsToWin, classicLegsWon, classicSetsWon,`,
  'receive checkout rules in Game'
);

replaceOnce(
  `                const active = teamIdx === activeTeamIdx && winner == null;\n                const currentDarts = active ? darts : [];\n                const teamName =`,
  `                const active = teamIdx === activeTeamIdx && winner == null;\n                const currentDarts = active ? darts : [];\n                const checkoutHint = active\n                  ? getCheckoutHint(scores[teamIdx], 3 - currentDarts.length, { double: outDouble, triple: outTriple, master: outMaster })\n                  : '';\n                const teamName =`,
  'team checkout calculation'
);

replaceOnce(
  `                    <div className="playerScore">\n                      {scores[teamIdx] ?? 0}\n                    </div>\n\n                    <div className="playerTurn">`,
  `                    <div className="playerScore">\n                      {scores[teamIdx] ?? 0}\n                    </div>\n                    {checkoutHint && (\n                      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent)', margin: '-2px 0 6px' }}>\n                        {t(lang, 'checkout')}: {checkoutHint}\n                      </div>\n                    )}\n\n                    <div className="playerTurn">`,
  'team checkout display'
);

replaceOnce(
  `              const p = players[pIdx];\n              const active = i === currIdx && winner == null;\n              const currentDarts = active ? darts : [];\n\n              return (`,
  `              const p = players[pIdx];\n              const active = i === currIdx && winner == null;\n              const currentDarts = active ? darts : [];\n              const checkoutHint = active && mode === 'classic'\n                ? getCheckoutHint(scores[pIdx], 3 - currentDarts.length, { double: outDouble, triple: outTriple, master: outMaster })\n                : '';\n\n              return (`,
  'individual checkout calculation'
);

replaceOnce(
  `                      <div className="playerScore">\n                        {scores[pIdx] ?? 0}\n                      </div>\n                      <div className="playerTurn classicTurn">`,
  `                      <div className="playerScore">\n                        {scores[pIdx] ?? 0}\n                      </div>\n                      {checkoutHint && (\n                        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent)', margin: '-2px 0 6px' }}>\n                          {t(lang, 'checkout')}: {checkoutHint}\n                        </div>\n                      )}\n                      <div className="playerTurn classicTurn">`,
  'individual checkout display'
);

fs.writeFileSync(path, src);
console.log('Checkout hint patch applied successfully.');
