import fs from 'node:fs';

const path = 'src/App.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(needle, replacement, label) {
  const count = src.split(needle).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  src = src.replace(needle, replacement);
}

replaceOnce(
  "  const [outMaster, setOutMaster] = useState(false);",
  "  // Double + Triple together behaves as Master-out; neither selected is Any-out.\n  const outMaster = outDouble && outTriple;",
  'derive master from double+triple'
);

replaceOnce(
  "      if (typeof s.outMaster === 'boolean') setOutMaster(s.outMaster);\n",
  "",
  'remove saved standalone master restore'
);

replaceOnce(
  "  const anyOutSelected = outDouble || outTriple || outMaster;",
  "  const anyOutSelected = outDouble || outTriple;",
  'active out rules'
);

replaceOnce(
  "    if ((m === 2 || m === 3 || isBullseyeCheckout) && outMaster) return true;\n",
  "",
  'remove standalone master finish branch'
);

replaceOnce(
  "      if (outMaster) rules.push('MA-OUT');\n",
  "",
  'remove master top label'
);

replaceOnce(
  "      outMaster={outMaster} setOutMaster={setOutMaster}\n",
  "",
  'remove master lobby props'
);

replaceOnce(
  "    outMaster, setOutMaster,\n",
  "",
  'remove master lobby parameters'
);

const masterUiBlock = `\n              <label className={\`tab \${outMaster ? 'active' : ''}\`}>\n                <input\n                  type=\"checkbox\"\n                  checked={outMaster}\n                  onChange={e => setOutMaster(e.target.checked)}\n                  style={{ marginRight: 6 }}\n                />\n                {t(lang, 'masterOut')}\n              </label>\n\n              <div style={{ opacity: .8, fontSize: 12 }}>\n                {t(lang, 'anyOutHint')}\n              </div>`;
replaceOnce(masterUiBlock, '', 'remove master checkbox and any-out hint');

replaceOnce(
  "  const restricted = rules.double || rules.triple || rules.master;\n  if (!restricted) return true;\n  if ((dart.m === 2 || dart.v === 50) && (rules.double || rules.master)) return true;\n  if (dart.m === 3 && (rules.triple || rules.master)) return true;",
  "  const restricted = rules.double || rules.triple;\n  if (!restricted) return true;\n  if ((dart.m === 2 || dart.v === 50) && rules.double) return true;\n  if (dart.m === 3 && rules.triple) return true;",
  'checkout finish rules'
);

replaceOnce(
  "  if (!rules.double && !rules.triple && !rules.master && dart.m === 1) {",
  "  if (!rules.double && !rules.triple && dart.m === 1) {",
  'checkout any-out rank'
);

replaceOnce(
  "  const key = [target, left, rules.double ? 1 : 0, rules.triple ? 1 : 0, rules.master ? 1 : 0].join('|');",
  "  const key = [target, left, rules.double ? 1 : 0, rules.triple ? 1 : 0].join('|');",
  'checkout cache key'
);

replaceOnce(
  "    const setupCost = route.slice(0, -1).reduce((sum, d) => sum + d.setupRank, 0);\n    const cost = setupCost + checkoutFinishRank(final, rules);",
  `    const setupCost = route.slice(0, -1).reduce((sum, d) => sum + d.setupRank, 0);\n    let cost = ((route.length - 1) * 100) + setupCost + checkoutFinishRank(final, rules);\n\n    if (route.length > 1) {\n      const first = route[0];\n      // Prefer a treble first. Avoid opening with Bull when a natural treble route exists.\n      if (first.m === 3) cost -= 20;\n      if (first.v === 50) {\n        const tripleOnly = rules.triple && !rules.double;\n        cost += tripleOnly ? 250 : 80;\n      }\n    }`,
  'checkout route preference'
);

replaceOnce(
  "  for (let len = 1; len <= left && !best; len += 1) {",
  "  for (let len = 1; len <= left; len += 1) {",
  'evaluate all route lengths'
);

// Remove the term Master-out from user-visible Classic help/round-total confirmation.
src = src.replaceAll(' / Master-out', '');
src = src.replaceAll('/master-out', '');
src = src.replaceAll('/Master-out', '');

fs.writeFileSync(path, src);
console.log('Checkout out-rules cleanup patch applied.');
