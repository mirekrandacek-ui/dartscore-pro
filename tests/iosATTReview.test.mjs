import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = (await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const native = await readFile(new URL('../ios/App/App/MetaMeasurement.swift', import.meta.url), 'utf8');
const plugin = await readFile(new URL('../ios/App/App/SceneDelegate.swift', import.meta.url), 'utf8');

const start = app.indexOf('async function ensureIOSAdMobReady() {');
const end = app.indexOf('\n}\n\nasync function showIOSBanner()', start);
assert.ok(start !== -1 && end > start, 'actual iOS AdMob initialization method must exist');
const functionSource = app.slice(start, end + 2);

async function runStartup({ consent = true, trackingAllowed = false, delayedATT = false, attFails = false } = {}) {
  const events = [];
  let resolveATT;
  const gate = delayedATT ? new Promise(resolve => { resolveATT = resolve; }) : null;
  const context = vm.createContext({
    IS_IOS: true,
    IOS_ADMOB_APP_ID: 'ios-app-id',
    iosPrivacy: {
      async prepare() {
        events.push('UMP');
        return { canRequestAds: consent };
      }
    },
    DartScoreIOS: {
      async requestTrackingAuthorizationIfNeeded() {
        events.push('ATT');
        if (attFails) throw new Error('ATT unavailable');
        if (gate) await gate;
        return { authorized: trackingAllowed };
      }
    },
    AdMob: {
      async initialize() {
        events.push('AdMob.initialize');
      }
    }
  });
  const run = vm.runInContext(`(async () => {
    let iosAdMobInitialized = false;
    ${functionSource}
    return ensureIOSAdMobReady();
  })()`, context);
  return { run, events, resolveATT };
}

test('Free iOS startup awaits UMP and ATT before initializing AdMob, including US reviewer case', async () => {
  const { run, events } = await runStartup({ trackingAllowed: true });
  assert.equal(await run, true);
  assert.deepEqual(events, ['UMP', 'ATT', 'AdMob.initialize']);
});

test('ATT denial still permits ads with OS tracking restricted', async () => {
  const { run, events } = await runStartup({ trackingAllowed: false });
  assert.equal(await run, true);
  assert.deepEqual(events, ['UMP', 'ATT', 'AdMob.initialize']);
});

test('ad SDK cannot initialize while foreground ATT permission is pending', async () => {
  const { run, events, resolveATT } = await runStartup({ delayedATT: true });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, ['UMP', 'ATT']);
  resolveATT();
  assert.equal(await run, true);
  assert.deepEqual(events, ['UMP', 'ATT', 'AdMob.initialize']);
});

test('no ATT request or ad SDK when UMP disallows requesting ads', async () => {
  const { run, events } = await runStartup({ consent: false });
  assert.equal(await run, false);
  assert.deepEqual(events, ['UMP']);
});

test('permission bridge failure blocks ad SDK initialization', async () => {
  const { run, events } = await runStartup({ attFails: true });
  await assert.rejects(run, /ATT unavailable/);
  assert.deepEqual(events, ['UMP', 'ATT']);
});

test('native iOS ATT bridge is registered and implemented', () => {
  assert.match(plugin, /CAPPluginMethod\(name: "requestTrackingAuthorizationIfNeeded", returnType: CAPPluginReturnPromise\)/);
  assert.match(plugin, /@objc func requestTrackingAuthorizationIfNeeded\(_ call: CAPPluginCall\)/);
  assert.match(plugin, /MetaMeasurement\.shared\.requestTrackingAuthorizationIfNeeded/);
});

test('native ATT is queued until active, deduplicated, retried on scene activation', () => {
  assert.match(native, /pendingTrackingCompletions\.append\(completion\)/);
  assert.match(native, /guard !trackingRequestInFlight, !pendingTrackingCompletions\.isEmpty,/);
  assert.match(native, /UIApplication\.shared\.applicationState == \.active/);
  assert.match(native, /func becameActive\(\) \{[\s\S]*?startPendingTrackingRequest\(\)/);
  assert.match(native, /callbacks\.forEach \{ \$0\(status == \.authorized\) \}/);
  assert.equal((native.match(/ATTrackingManager\.requestTrackingAuthorization \{/g) || []).length, 1,
    'Meta and Free ads must share one native ATT request implementation');
});

test('Meta measurement remains gated on explicit UMP opt-in and authorized ATT', () => {
  assert.match(native, /if allowed\(trackingAuthorized: true\) \{/);
  assert.match(native, /let enabled = allowed\(trackingAuthorized: ATTrackingManager\.trackingAuthorizationStatus == \.authorized\)/);
  assert.match(native, /if enabled && !activatedThisForeground \{/);
});
