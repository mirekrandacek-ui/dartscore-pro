import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const native = await readFile(new URL('../ios/App/App/MetaMeasurement.swift', import.meta.url), 'utf8');

const jsEffectStart = app.indexOf('useEffect(() => {', app.indexOf('const [privacyOptionsRequired,'));
const jsEffectEnd = app.indexOf('}, [premiumStateResolved]);', jsEffectStart);
const consentEffect = app.slice(jsEffectStart, jsEffectEnd);
const swiftSuspend = native.slice(native.indexOf('func suspend()'), native.indexOf('func prepare('));
const swiftPrepare = native.slice(native.indexOf('func prepare('), native.indexOf('func showOptions('));

test('iOS checks UMP at launch but never reopens the consent form on visibilitychange', () => {
  assert.ok(consentEffect.includes('iosPrivacy.prepare()'), 'launch must obtain UMP consent state');
  assert.ok(!consentEffect.includes('refresh: true'), 'foreground must not invalidate consent');
  assert.ok(!consentEffect.includes('visibilitychange'), 'foreground events must not re-present UMP');
});

test('native consent remains valid across background/foreground without disabling Meta safety gate', () => {
  assert.ok(!swiftSuspend.includes('updated = false'), 'background must not reset fresh UMP decision');
  assert.ok(swiftSuspend.includes('activatedThisForeground = false'), 'Meta resumes only on active scene');
  assert.ok(swiftPrepare.includes('if updated {'), 'native preparation must deduplicate a WebView reload');
  assert.ok(swiftPrepare.includes('ConsentInformation.shared.requestConsentInfoUpdate'), 'UMP still refreshes on a new native launch');
  assert.ok(swiftPrepare.includes('ConsentForm.loadAndPresentIfRequired'), 'required new consent prompts must still work');
});

test('user can always open required privacy choices manually; no artificial acceptance flag', () => {
  assert.ok(app.includes('onClick={openIOSPrivacy}'), 'privacy choices must remain accessible');
  assert.ok(native.includes('ConsentForm.presentPrivacyOptionsForm'), 'privacy options form must remain available');
  assert.ok(!native.includes('ConsentInformation.shared.reset()'), 'production must not wipe stored UMP consent');
});
