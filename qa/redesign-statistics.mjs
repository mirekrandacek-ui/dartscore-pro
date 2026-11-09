import fs from 'node:fs';import assert from 'node:assert/strict';
const{chromium,webkit}=await import(process.env.DARTSCORE_PLAYWRIGHT_MODULE||'playwright');
const out='build/redesign-statistics';fs.mkdirSync(out,{recursive:true});const results=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch();try{
 for(const width of[320,360,393,430])for(const lang of['cs','en','de','es','nl','ru','zh']){
  const c=await b.newContext({viewport:{width,height:740},isMobile:true,hasTouch:true,locale:lang});await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  const p=await c.newPage();try{
   await p.goto(process.env.DARTSCORE_UI_URL||'http://127.0.0.1:4193/',{waitUntil:'networkidle'});
   await p.evaluate(lang=>{localStorage.clear();localStorage.setItem('premium','true');localStorage.setItem('lobbyDefaultsVersion','1.1.62');localStorage.setItem('lobby',JSON.stringify({lang,mode:'classic'}));
    localStorage.setItem('finishedGames',JSON.stringify([{ts:Date.now(),players:['Alexandra van der Meer','Mikhail Alexandrovich'],winner:'Alexandra van der Meer',playerStats:[{name:'Alexandra van der Meer',dartsThrown:30,pointsScored:501,first9Darts:9,first9Points:180,highestScore:180,highestCheckout:40,legsWon:1,setsWon:1},{name:'Mikhail Alexandrovich',dartsThrown:27,pointsScored:420,first9Darts:9,first9Points:150}]}]));},lang);
   await p.reload({waitUntil:'networkidle'});await p.locator('.statisticsView .tab').first().waitFor();
   for(const tab of[0,1]){
    await p.locator('.statisticsView .tab').nth(tab).click();
    const issues=await p.locator('.statisticsView').evaluate(card=>{const c=card.getBoundingClientRect();const issues=[];for(const e of card.querySelectorAll('div,span,strong,button')){const r=e.getBoundingClientRect();if(r.width>0&&(r.left<c.left-1||r.right>c.right+1||e.scrollWidth>e.clientWidth+2))issues.push({text:e.textContent.slice(0,80),className:e.className});}return issues;});assert.deepEqual(issues,[],`${engine} ${width} ${lang} tab${tab}`);
   }
   results.push({engine,width,lang,status:'pass'});
  }finally{await c.close();fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));}
 }
 }finally{await b.close();}
}
console.log(results.length,'statistics language/width cases passed');
