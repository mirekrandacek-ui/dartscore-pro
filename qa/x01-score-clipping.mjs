// Run against a local Vite server; requires Playwright WebKit and Chromium.
import assert from 'node:assert/strict';
import {webkit,chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('build/x01-score-evidence',{recursive:true});const results=[];
try{for(const [engine,type] of Object.entries({webkit,chromium})){
const b=await type.launch();try{for(const width of [320,375,390,430]){for(const premium of [false,true]){
const c=await b.newContext({viewport:{width,height:844},locale:'cs-CZ',isMobile:true,hasTouch:true}); const p=await c.newPage();
await p.addInitScript(({premium})=>localStorage.setItem('savedGame',JSON.stringify({screen:'game',mode:'classic',lang:'cs',players:[{id:1,name:'Dlouhé jméno hráče'},{id:2,name:'Robot',bot:true,level:1}],order:[0,1],currIdx:0,scores:[100,44],lastTurn:[180,100],thrown:[21,21],isPremium:premium})),{premium});
await p.goto(process.env.DARTSCORE_UI_URL || 'http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'Pokračovat ve hře',exact:true}).click();await p.locator('.classicTurn').first().waitFor();
assert.deepEqual(await p.locator('.classicAroundPane .playerScore').allTextContents(), ['100', '44']);
assert.deepEqual(await p.locator('.classicAroundPane .lastTotal').allTextContents(), ['Poslední hod: 180', 'Poslední hod: 100']);
const issues=await p.evaluate(()=>{const issues=[];for(const card of document.querySelectorAll('.classicAroundPane .playerCard')){const r=card.getBoundingClientRect(); for(const e of card.querySelectorAll('.playerScore,.classicTurn,.lastTotal,.dartBox')){const b=e.getBoundingClientRect();if(b.right>r.right-1||b.left<r.left||e.scrollWidth>e.clientWidth+1)issues.push({class:e.className,text:e.textContent,right:b.right,cardRight:r.right,sw:e.scrollWidth,cw:e.clientWidth});}}if(document.documentElement.scrollWidth>innerWidth)issues.push('document scroll');return issues;});results.push({engine,width,premium,issues});await p.screenshot({path:`build/x01-score-evidence/${engine}-${width}-${premium}.png`});await c.close();
}}}finally{await b.close();}}}finally{writeFileSync('build/x01-score-evidence/results.json',JSON.stringify(results,null,2));}console.log(JSON.stringify(results,null,2)); if(results.some(r=>r.issues.length))process.exitCode=1;
