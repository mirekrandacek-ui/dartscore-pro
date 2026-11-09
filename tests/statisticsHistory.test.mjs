import test from 'node:test';
import assert from 'node:assert/strict';
import {readHistory,appendMatch,deleteMatches,undoDeletion,matchKey,playerDirectory,isDuel} from '../src/statisticsHistory.js';
import {teamIdentity,teamMatchDetails,statisticsGames} from '../src/statisticsHistory.js';
const storage = games => { const values=new Map([['finishedGames',JSON.stringify(games)]]); return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}; };
test('legacy history survives reading, hiding players and appending beyond 200 matches',()=>{
 const games=Array.from({length:260},(_,i)=>({ts:i,players:['Mirek','Petr'],winner:'Mirek'}));
 const s=storage(games),before=s.getItem('finishedGames');
 assert.equal(readHistory(s).length,260); assert.equal(playerDirectory(games,['Mirek']).length,1);
 assert.equal(s.getItem('finishedGames'),before);
 appendMatch(s,{ts:300,players:['Jana','Petr']});assert.equal(readHistory(s).length,261);
});
test('deletion and undo preserve another match saved in the meantime',()=>{
 const a={ts:1,players:['A','B']},b={ts:2,players:['A','C']},c={ts:3,players:['B','C']};const s=storage([a,b]);
 deleteMatches(s,[matchKey(a)]);assert.deepEqual(readHistory(s),[b]);appendMatch(s,c);undoDeletion(s);
 assert.deepEqual(readHistory(s),[c,b,a]);
});
test('archive quota failure does not delete history; malformed history is not overwritten',()=>{
 const a={ts:1,players:['A','B']},s=storage([a]),original=s.getItem('finishedGames');
 s.setItem=()=>{throw Error('quota')};assert.throws(()=>deleteMatches(s,[matchKey(a)]));assert.equal(s.getItem('finishedGames'),original);
 const bad={getItem:()=>'{broken',setItem:()=>assert.fail('must not write')};assert.throws(()=>appendMatch(bad,a));
});
test('head to head excludes teams and multiplayer matches',()=>{
 assert.equal(isDuel({players:['A','B']},'A','B'),true);
 assert.equal(isDuel({players:['A','B'],playerMode:'teams'},'A','B'),false);
 assert.equal(isDuel({players:['A','B','C']},'A','B'),false);
});
test('teams use the roster rather than the A/B/C slot and never affect individual results',()=>{
 const players=[{name:'Mirek',team:'A'},{name:'Jana',team:'A'},{name:'Petr',team:'C'}];
 const details=teamMatchDetails(players,2,[{avg3:50},null,{avg3:60}],false);
 assert.equal(details.winnerTeamId,teamIdentity(['Petr']));
 assert.equal(details.teams[0].id,teamIdentity(['Jana','Mirek']));
 const swapped=teamMatchDetails(players.map(p=>({...p,team:p.team==='A'?'B':'A'})),0);
 assert.deepEqual(details.teams.map(t=>t.id).sort(),swapped.teams.map(t=>t.id).sort());
 const teamGame={mode:'classic',playerMode:'teams',players:players.map(p=>p.name),...details};
 const legacy={mode:'classic',players:['Mirek','Petr'],winner:'Team A',remainingByPlayer:[{name:'Team A',remaining:0},{name:'Team B',remaining:10}]};
 const solo={mode:'classic',players:['Mirek','Petr'],winner:'Mirek'};
 const all=[teamGame,legacy,solo],original=JSON.stringify(all);
 assert.deepEqual(statisticsGames(all,'players'),[solo]);
 const projected=statisticsGames(all,'teams');assert.equal(projected.length,1);
 assert.equal(projected[0].winner,teamIdentity(['Petr']));
 assert.equal(projected[0].playerStats.find(s=>s.name===teamIdentity(['Petr'])).avg3,60);
 assert.equal(JSON.stringify(all),original);
 const s=storage(all);deleteMatches(s,[matchKey(projected[0])]);assert.deepEqual(readHistory(s),[legacy,solo]);undoDeletion(s);assert.equal(readHistory(s).length,3);
 assert.equal(teamMatchDetails(players,0,[],true).winnerTeamId,'');
});
