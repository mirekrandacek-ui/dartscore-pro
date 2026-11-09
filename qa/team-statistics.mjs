import {chromium,webkit} from '../../.qa-runtime/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='build/team-statistics-20261106',results=[];fs.mkdirSync(out,{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{for(const width of [320,393]){
 const ctx=await b.newContext({viewport:{width,height:780},isMobile:true,hasTouch:true});
 await ctx.addInitScript(()=>{
  if(sessionStorage.getItem('team-qa'))return;sessionStorage.setItem('team-qa','1');
  localStorage.setItem('premium','true');localStorage.setItem('lobbyDefaultsVersion','1.1.62');
  localStorage.setItem('lobby',JSON.stringify({lang:'cs',mode:'classic',startScore:101,scoreInputMode:'round',playerMode:'teams',outDouble:false,outTriple:false,outMaster:false,randomOrder:false,ai:'off',players:[{id:1,name:'Mirek',team:'A'},{id:2,name:'Petr',team:'B'},{id:3,name:'Jana',team:'A'},{id:4,name:'Eva',team:'B'}]}));
  localStorage.setItem('finishedGames',JSON.stringify([{ts:1,mode:'classic',players:['Mirek','Petr'],winner:'Mirek'},{ts:2,mode:'classic',players:['Mirek','Petr'],winner:'Tým A',remainingByPlayer:[{name:'Tým A',remaining:0},{name:'Tým B',remaining:40}]}]));
 });
 await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.env.DARTSCORE_UI_URL,{waitUntil:'networkidle'});
 await p.locator('.lobbyStartActions .green').click();await p.locator('.roundTotalKeypad').waitFor();
 for(const n of ['1','0','1'])await p.locator('.roundTotalKeypad button').filter({hasText:new RegExp('^'+n+'$')}).click();
 await p.locator('.roundTotalKeypad button').filter({hasText:/^OK$/}).click();
 await p.waitForFunction(()=>JSON.parse(localStorage.getItem('finishedGames')).length===3);
 const records=await p.evaluate(()=>JSON.parse(localStorage.getItem('finishedGames'))),game=records[0];
 assert.equal(game.playerMode,'teams');assert.equal(game.teams.length,2);
 const winning=game.teams.find(t=>t.id===game.winnerTeamId);assert.deepEqual(winning.members,['Mirek','Jana']);assert.equal(winning.stats.pointsScored,101);assert.equal(winning.stats.legsWon,1);assert.equal(winning.stats.setsWon,1);
 // Reload proves persistence; seed runs only once per test context.
 await p.reload({waitUntil:'networkidle'});const card=p.locator('.stats-dashboard');await card.waitFor();
 assert.match(await card.textContent(),/1 zápasy/);assert.equal(await card.locator('.stats-player-picker summary').count(),1);
 await card.getByRole('button',{name:'Týmy',exact:true}).click();assert.match(await card.textContent(),/Jana \+ Mirek/);
 assert.equal(await card.locator('.stats-player-picker summary').count(),1);
 await card.locator('.stats-player-picker summary').click();
 await card.locator('.stats-picker-results button').filter({hasText:'Jana + Mirek'}).click();
 await p.waitForFunction(()=>document.querySelector('.stats-dashboard')?.textContent.includes('100 %'));
 await card.locator('.stats-view-tabs .tab').nth(1).click();assert.equal(await card.locator('.stats-player-picker').count(),2);assert.match(await card.textContent(),/Jana \+ Mirek/);assert.match(await card.textContent(),/Eva \+ Petr/);
 assert.ok(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+2));await p.screenshot({path:`${out}/${engine}-${width}-teams.png`,fullPage:true});
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('finishedGames')).length),3);assert.deepEqual(errors,[]);
 results.push({engine,width,automaticTeamSave:true,teamMetrics:true,separatePlayers:true,result:'PASS'});await ctx.close();
 }}finally{await b.close();fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));}
}
console.log(results);
