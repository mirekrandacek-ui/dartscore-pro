const KEY='dartscore.stats.v1';

export function loadStats(){
  try{ return JSON.parse(localStorage.getItem(KEY)) || {history:[]} }
  catch{ return {history:[]} }
}

export function saveGame(payload){
  const s = loadStats();
  s.history.push({...payload, ts: Date.now()});
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function aggregate(days){
  const s = loadStats();
  const now = Date.now();
  const from = days ? now - days*86400000 : 0;
  const games = s.history.filter(g=>g.ts>=from);
  const totals = {
    games: games.length,
    darts: games.reduce((a,g)=>a+(g.darts||0),0),
    avg: Number((games.reduce((a,g)=>a+(g.ppd||0),0)/(games.length||1)).toFixed(2)),
  };
  return {games, totals};
}
