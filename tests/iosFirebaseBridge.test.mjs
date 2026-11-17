import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../src/analyticsEvents.js', import.meta.url), 'utf8');
const first = source.indexOf('const sendNativeAnalyticsEvent = (');
const last = source.indexOf('const markGameStarted = (', first);
function sender(window) {
  return vm.runInNewContext(source.slice(first, last) + '\nsendNativeAnalyticsEvent', {
    window, URLSearchParams, setTimeout() { throw Error('unexpected navigation timer'); }
  });
}
test('iOS forwards usage through its native bridge without navigating or invoking Android', () => {
  const calls = [];
  const window = { DartScoreIOSAnalytics: value => calls.push(value),
    DartScoreAndroid: { logAnalyticsEvent() { throw Error('wrong platform'); } },
    location: { href: 'capacitor://localhost/' } };
  sender(window)('game_completed', { game_type: 'classic' }, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].event, 'game_completed');
  assert.equal(calls[0].params.game_type, 'classic');
  assert.equal(window.location.href, 'capacitor://localhost/');
});
test('an unavailable measurement bridge never interrupts the game or navigates', () => {
  const window = { DartScoreIOSAnalytics() { throw Error('unavailable'); },
    location: { href: 'capacitor://localhost/' } };
  assert.doesNotThrow(() => sender(window)('game_started', {}));
  assert.equal(window.location.href, 'capacitor://localhost/');
});
