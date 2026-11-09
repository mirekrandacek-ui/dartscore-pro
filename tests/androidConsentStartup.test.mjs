import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const launcher = readFileSync(new URL(
  '../app/src/main/java/com/randis2288/dartscorepro/ConsentLauncherActivity.java',
  import.meta.url), 'utf8');

test('consent launcher installs its window content before UMP can inspect the decor', () => {
  // Configuration guard for the real-device startup regression. Runtime stress
  // tests are still required: source ordering alone cannot prove absence of a race.
  const body = launcher.slice(launcher.indexOf('protected void onCreate('));
  const content = body.indexOf('setContentView(new FrameLayout(this))');
  const sdk = body.indexOf('UserMessagingPlatform.getConsentInformation(this)');
  const request = body.indexOf('consentInformation.requestConsentInfoUpdate(');
  assert.ok(content >= 0, 'install a native content container on the UI thread');
  assert.ok(content < sdk && sdk < request,
    'the decor must exist before the first UMP SDK access and async request');
});
