import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';

const dir='build/ui-physical-qa-20261105/s10';
const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',['-s','RF8M20CL3WY',...args],{encoding:'utf8',timeout:30000});
const b=await chromium.connectOverCDP('http://127.0.0.1:9226',{noDefaults:true,timeout:20000});
try {
 const page=b.contexts()[0].pages().find(p=>p.url()==='https://dartscore-pro.vercel.app/');
 assert.ok(page,'WebView of physical S10 must be available');
 page.setDefaultTimeout(15000);
 await page.waitForFunction(()=>document.querySelector('.container')?.dataset.screen==='lobby');
 const before=await page.locator('.playerName input').evaluateAll(xs=>xs.map(x=>x.value));
 const buttons=page.locator('.playerDragHandle');
 assert.equal(await buttons.count(),before.length,'one icon per player');
 assert.ok(before.length>=2,'need at least two players');
 await buttons.first().scrollIntoViewIfNeeded();
 const a=await buttons.first().boundingBox(),next=await buttons.nth(1).boundingBox();
 assert.ok(a&&next,'buttons must have visible geometry');
 const data=await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('.playerRow')];
  return rows.map(row=>{
   const drag=row.querySelector('.playerDragHandle');
   const trash=row.querySelector('.trash');
   const svg=drag.querySelector('svg'), poly=[...svg.querySelectorAll('polygon')].map(p=>p.getAttribute('points'));
   const r=drag.getBoundingClientRect(), tr=trash.getBoundingClientRect(), n=row.querySelector('.playerName').getBoundingClientRect();
   return {handleWidth:r.width, handleHeight:r.height, handleX:r.x,trashX:tr.x,nameRight:n.right,iconLeftOfDelete:r.right<=tr.left+0.5,iconRightOfName:r.left>=n.right-0.5,polygonCount:poly.length,points:poly,overflow:row.scrollWidth>row.clientWidth+1,label:drag.getAttribute('aria-label')};
  });
 });
 assert.ok(data.every(x=>x.iconLeftOfDelete&&x.iconRightOfName&&!x.overflow&&x.polygonCount===2),JSON.stringify(data));
 const c=await page.context().newCDPSession(page);
 const x=a.x+a.width/2,y=a.y+a.height/2,destY=next.y+next.height/2;
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 await page.waitForTimeout(480);
 const held=await page.locator('.playerRow.dragging').count();
 await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:destY}]});
 await page.waitForTimeout(120);
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(170);
 const after=await page.locator('.playerName input').evaluateAll(xs=>xs.map(x=>x.value));
 const moved=after[0]===before[1]&&after[1]===before[0];
 adb('shell','screencap','-p','/sdcard/Download/dsp-s10-drag-icon.png');
 adb('pull','/sdcard/Download/dsp-s10-drag-icon.png',dir+'/drag-icon-approved.png');
 const result={before,after,held,moved,data};
 fs.writeFileSync(dir+'/drag-icon-approved.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({before,after,held,moved,row:data[0],testedRows:data.length},null,2));
 assert.equal(held,1,'long touch on handle activates drag');
 assert.equal(moved,true,'long drag via handle changes player order');
} finally {await b.close()}
