import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from '../../.qa-runtime/node_modules/playwright/index.mjs';
const out='build/statistics-transfer-20261106';fs.mkdirSync(out,{recursive:true});
const results=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{
 for(const width of [320,393]){
 const p=await b.newPage({viewport:{width,height:780}});const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await p.goto(process.env.DARTSCORE_UI_URL||'http://127.0.0.1:4197/');
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('premium','true');localStorage.setItem('lobbyDefaultsVersion','1.1.62');localStorage.setItem('lobby',JSON.stringify({lang:'cs',mode:'classic'}));localStorage.setItem('finishedGames',JSON.stringify(Array.from({length:260},(_,i)=>({ts:Date.now()-i*86400000,players:['Mirek','Petr'],winner:i%2?'Petr':'Mirek',playerMode:'individual'}))));});
 await p.reload();const card=p.locator('.stats-dashboard');await card.waitFor();
 const history=()=>p.evaluate(()=>localStorage.getItem('finishedGames'));const original=await history();
 await card.locator('.stats-player-picker summary').first().click();await card.locator('input[type="search"]').fill('petr');await card.locator('.stats-picker-results button').click();
 assert.equal(await history(),original);
 await card.locator('.stats-management summary').click();
 await card.getByRole('button',{name:'Skrýt vybraného hráče',exact:true}).click();assert.equal(await history(),original);
 await card.getByRole('button',{name:/Znovu zobrazit/}).click();assert.equal(await history(),original);
 await card.getByRole('button',{name:/Smazat zápasy hráče/}).click();await p.locator('dialog[open]').waitFor();await p.locator('dialog').getByRole('button',{name:'Zrušit',exact:true}).click();assert.equal(await history(),original);
 await card.getByRole('button',{name:/Smazat zápasy hráče/}).click();await p.locator('dialog').getByRole('button',{name:'Smazat zápasy (260)',exact:true}).click();assert.equal(JSON.parse(await history()).length,0);
 await card.getByRole('button',{name:'Vrátit poslední smazání',exact:true}).click();assert.equal(JSON.parse(await history()).length,260);
 await p.reload();assert.equal(JSON.parse(await history()).length,260);
 for(const tab of [0,1]){await card.locator('.stats-view-tabs .tab').nth(tab).click();assert.ok(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+2));await p.screenshot({path:`${out}/${engine}-${width}-tab${tab}.png`,fullPage:true});}
 assert.deepEqual(errors,[]);results.push({engine,width,history:260,result:'PASS'});await p.close();
 }
 }finally{await b.close();fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));}
}
console.log(results);

