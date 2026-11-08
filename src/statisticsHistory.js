export const HISTORY_KEY = 'finishedGames';
export const ARCHIVE_KEY = 'dartscore.stats.lastDeletion.v1';
export const HIDDEN_KEY = 'dartscore.stats.hiddenPlayers.v1';

export function readHistory(storage) {
  const value = JSON.parse(storage.getItem(HISTORY_KEY) || '[]');
  if (!Array.isArray(value) || value.some(g => !g || !Array.isArray(g.players))) {
    throw new Error('Invalid saved match history');
  }
  return value;
}

export const matchKey = game => game._historyKey || game.id || JSON.stringify(game);
export const isTeamGame = game => game.playerMode === 'teams' || (
  game.mode === 'classic' && Array.isArray(game.remainingByPlayer)
  && game.remainingByPlayer.some(row => !game.players.includes(row.name))
);
export const teamIdentity = members => JSON.stringify([...members].sort());
export const teamLabel = identity => {
  try { return JSON.parse(identity).join(' + '); } catch { return identity; }
};
export function teamMatchDetails(players, winnerIndex, stats = [], draw = false) {
  const teams = ['A','B','C'].flatMap((code,index) => {
    const members=players.filter(p => p.team === code).map(p => p.name);
    if (!members.length) return [];
    const id=teamIdentity(members);
    return [{id,code,members,stats:stats[index] ? {...stats[index],name:id} : null}];
  });
  return {teams,winnerTeamId:draw ? '' : (teams.find(t => t.code === ['A','B','C'][winnerIndex])?.id || '')};
}
// Read-only view: deletion keys still refer to the original stored match.
export function statisticsGames(games, scope) {
  if (scope !== 'teams') return games.filter(g => !isTeamGame(g));
  return games.filter(g => isTeamGame(g) && Array.isArray(g.teams) && g.teams.length >= 2).map(g => ({
    ...g,_historyKey:matchKey(g),playerMode:'individual',
    players:g.teams.map(t=>t.id),winner:g.winnerTeamId || '',
    playerStats:g.teams.filter(t=>t.stats).map(t=>({...t.stats,name:t.id}))
  }));
}
export const searchName = name => String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
export const isDuel = (game, a, b) => a && b && a !== b && game.players.length === 2
  && game.playerMode !== 'teams' && game.players.includes(a) && game.players.includes(b);

export function playerDirectory(games, hidden = []) {
  const directory = new Map();
  for (const game of games) {
    for (const name of new Set(game.players.filter(n => typeof n === 'string' && n.trim()))) {
      const previous = directory.get(name) || { name, matches: 0, lastPlayed: 0 };
      directory.set(name, { name, matches: previous.matches + 1, lastPlayed: Math.max(previous.lastPlayed, Number(game.ts) || 0) });
    }
  }
  return [...directory.values()].filter(p => !hidden.includes(p.name))
    .sort((a, b) => b.lastPlayed - a.lastPlayed || a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export function appendMatch(storage, game) {
  const games = readHistory(storage);
  storage.setItem(HISTORY_KEY, JSON.stringify([game, ...games]));
}

// Archive first. If quota/storage fails, the original history stays untouched.
// Re-read at confirmation time so a newer saved game is never overwritten.
export function deleteMatches(storage, keys) {
  const games = readHistory(storage);
  const selected = new Set(keys);
  const removed = games.filter(g => selected.has(matchKey(g)));
  if (!removed.length) return games;
  storage.setItem(ARCHIVE_KEY, JSON.stringify({ version: 1, removed, deletedAt: Date.now() }));
  const remaining = games.filter(g => !selected.has(matchKey(g)));
  storage.setItem(HISTORY_KEY, JSON.stringify(remaining));
  return remaining;
}

export function undoDeletion(storage) {
  const games = readHistory(storage);
  const archive = JSON.parse(storage.getItem(ARCHIVE_KEY) || 'null');
  if (!Array.isArray(archive?.removed)) return games;
  const existing = new Set(games.map(matchKey));
  const restored = [...games, ...archive.removed.filter(g => !existing.has(matchKey(g)))].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  storage.setItem(HISTORY_KEY, JSON.stringify(restored));
  storage.removeItem(ARCHIVE_KEY);
  return restored;
}
