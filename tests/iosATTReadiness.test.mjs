import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const start=source.indexOf('let iosAdMobInitialized = false;');
const code=source.slice(start,source.indexOf('async function showIOSBanner',start));
function setup(status='notDetermined',consent=true,fail=false){
 const events=[];const context=vm.createContext({IS_IOS:true,IOS_ADMOB_APP_ID:'ios-test',iosPrivacy:{async prepare(){events.push('consent');return {canRequestAds:consent};}},AdMob:{async trackingAuthorizationStatus(){events.push('status');return {status};},async requestTrackingAuthorization(){events.push('ATT');if(fail)throw Error('native failure');},async initialize(){events.push('initialize');}}});
 vm.runInContext(code,context);return{events,ready:()=>vm.runInContext('ensureIOSAdMobReady()',context)};
}
test('ATT completes before ads initialize and concurrent callers share a request',async()=>{const s=setup();await Promise.all([s.ready(),s.ready()]);assert.deepEqual(s.events,['consent','status','ATT','initialize']);});
for(const status of ['authorized','denied','restricted'])test(`existing ATT ${status} is not prompted again`,async()=>{const s=setup(status);assert.equal(await s.ready(),true);assert.deepEqual(s.events,['consent','status','initialize']);});
test('unavailable ad consent prevents both ATT request and ad initialization',async()=>{const s=setup('notDetermined',false);assert.equal(await s.ready(),false);assert.deepEqual(s.events,['consent']);});
test('native ATT failure cannot initialize ads and does not leave readiness stuck',async()=>{const s=setup('notDetermined',true,true);await assert.rejects(s.ready(),/native failure/);await assert.rejects(s.ready(),/native failure/);assert.equal(s.events.includes('initialize'),false);assert.equal(s.events.filter(e=>e==='ATT').length,2);});
