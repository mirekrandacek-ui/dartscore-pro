import {chromium,webkit} from '../../.qa-runtime/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const results=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{
 for(const mode of ['classic','cricket','around','roulette','rouletteDouble']){
 const ctx=await b.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
 await ctx.addInitScript(mode=>{localStorage.setItem('premium','true');localStorage.setItem('lobbyDefaultsVersion','1.1.62');localStorage.setItem('lobby',JSON.stringify({lang:'en',mode,ai:'off',outDouble:false,randomOrder:false,players:[{id:1,name:'Mirek',team:'A'},{id:2,name:'Petr',team:'B'}]}));},mode);
 await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.env.DARTSCORE_UI_URL);await p.locator('.lobbyStartActions .green').click();await p.locator('.gameTopBar').waitFor();
 const voice=p.locator('.gameTopBar button').filter({has:p.locator('.iconHead')});assert.equal(await voice.count(),mode==='classic'?1:0);
 if(mode==='classic'){await voice.click();assert.equal(await voice.getAttribute('aria-pressed'),'false');}
 await p.screenshot({path:`build/statistics-transfer-20261106/${engine}-${mode}-voice.png`});assert.deepEqual(errors,[]);results.push({engine,mode,result:'PASS'});await ctx.close();
 }
 }finally{await b.close();}
}
fs.writeFileSync('build/statistics-transfer-20261106/voice-results.json',JSON.stringify(results,null,2));console.log(results);
