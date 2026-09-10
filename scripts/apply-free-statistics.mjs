import fs from 'node:fs';

const path = 'src/App.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(needle, replacement, label) {
  const count = src.split(needle).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  src = src.replace(needle, replacement);
}

replaceOnce(
  "      if (isPremium) {\n        try {\n          const list = JSON.parse(localStorage.getItem('finishedGames') || '[]');",
  "      {\n        try {\n          const list = JSON.parse(localStorage.getItem('finishedGames') || '[]');",
  'store finished games for all users'
);

replaceOnce(
  "        {isPremium && <StatisticsDashboard lang={lang} t={t} showToast={showToast} />}",
  "        <StatisticsDashboard lang={lang} t={t} showToast={showToast} />",
  'show statistics for all users'
);

// Statistics are no longer a Premium-only feature. Keep Premium copy truthful.
const replacements = [
  ["premiumFeature3: 'Statistiky hráčů'", "premiumFeature3: 'Podpora dalšího vývoje'"],
  ["premiumFeature3: 'Player statistics'", "premiumFeature3: 'Support future development'"],
  ["premiumFeature3: 'Spielerstatistiken'", "premiumFeature3: 'Unterstützt die Weiterentwicklung'"],
  ["premiumFeature3: 'Estadísticas de jugadores'", "premiumFeature3: 'Apoya el desarrollo futuro'"],
  ["premiumFeature3: 'Spelerstatistieken'", "premiumFeature3: 'Steun verdere ontwikkeling'"],
  ["premiumFeature3: 'Статистика игроков'", "premiumFeature3: 'Поддержка дальнейшей разработки'"],
  ["premiumFeature3: \"玩家统计\"", "premiumFeature3: \"支持后续开发\""]
];
for (const [needle, replacement] of replacements) {
  if (src.includes(needle)) src = src.replace(needle, replacement);
}

fs.writeFileSync(path, src);
console.log('Free statistics patch applied.');
