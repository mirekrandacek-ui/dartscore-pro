import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';

const langs=['cs','en','de','es','nl','ru','zh'];
const results=[],url='http://127.0.0.1:4193/';
// Android release uses Chromium; run iOS WebKit separately with the iOS build.
for(const [name,engine] of [['chromium',chromium]]) {
  const browser=await engine.launch();
  try {
    for(const width of [320,393]) for(const premium of [false,true])for(const lang of langs){
      const ctx=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
      const page=await ctx.newPage();
      try {
        await page.goto(url,{waitUntil:'domcontentloaded'});
        // Wait for the initial React mount before changing storage, otherwise it can overwrite the fixture.
        await page.waitForFunction(()=>document.querySelectorAll('.playerRow').length>0);
        await page.evaluate(({lang,premium})=>{
          localStorage.clear();
          localStorage.setItem('lobbyDefaultsVersion','1.1.62');
          localStorage.setItem('premium',String(premium));
          localStorage.setItem('lobby',JSON.stringify({lang,mode:'rouletteDouble',ai:'off',randomOrder:false,players:Array.from({length:6},(_,i)=>({id:'qa-drag-'+i,name:'Player '+(i+1)}))}));
        },{lang,premium});
        await page.reload({waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>document.querySelectorAll('.playerRow').length===6);
        const measure=await page.evaluate(()=>{
          const all=[...document.querySelectorAll('.playerRow')];
          return {rowCount:all.length,
            handles:document.querySelectorAll('.playerDragHandle').length,
            screenOverflow:document.documentElement.scrollWidth>innerWidth+1,
            rows:all.map(row=>{
              const n=row.querySelector('.playerName').getBoundingClientRect();
              const h=row.querySelector('.playerDragHandle').getBoundingClientRect();
              const d=row.querySelector('.trash').getBoundingClientRect();
              return {label:row.querySelector('.playerDragHandle').getAttribute('aria-label'),
              goodOrder:n.right<=h.left+1&&h.right<=d.left+1,
              visible:h.width>=38&&h.height>=38,
              svg:row.querySelectorAll('.playerDragHandle polygon').length,
              overflow:row.scrollWidth>row.clientWidth+1};
            })
          };
        });
        assert.equal(measure.handles,6);
        assert.equal(measure.screenOverflow,false);
        assert.ok(measure.rows.every(x=>x.label&&x.goodOrder&&x.visible&&x.svg===2&&!x.overflow),JSON.stringify(measure));
        results.push({name,width,premium,lang,status:'pass'});
      }catch(error) {
        results.push({name,width,premium,lang,status:'fail',error:String(error)});
        console.log('FAIL',name,width,premium,lang,String(error).slice(0,250));
      }finally{await ctx.close();}
    }
  }finally{await browser.close();}
}
fs.writeFileSync('build/ui-physical-qa-20261105/drag-icon-locale-matrix.json',JSON.stringify(results,null,2));
const failures=results.filter(x=>x.status!=='pass');
console.log('LOCALE MATRIX:',results.length,'cases;',failures.length,'failures');
assert.equal(failures.length,0);
