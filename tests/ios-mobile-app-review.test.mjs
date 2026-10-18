import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('one device-width viewport declaration for iOS', () => {
  const html = read('index.html');
  assert.equal(html.split('name="viewport"').length - 1, 1);
  assert.ok(html.includes('width=device-width'));
  assert.ok(html.includes('viewport-fit=cover'));
});

test('mobile flex containers and player cards cannot expand past viewport width', () => {
  const css = read('src/app.css');
  const selectors = ['.container', '.lobbyWrap', '.lobbyCard', '.gameWrap', '.playersPane', '.padPane', '.playerCard'];
  for (const selector of selectors) {
    const start = css.indexOf(selector + '{');
    assert.ok(start >= 0, selector + ' must exist');
    const end = css.indexOf('}', start);
    const block = css.slice(start, end);
    assert.ok(block.includes('min-width:0'), selector + ' must have min-width:0');
  }
  assert.ok(!css.includes('max-width:100vw;'));
});

test('web-only publisher copy is hidden in native iOS and Android', () => {
  const app = read('src/App.jsx');
  assert.ok(app.includes('const isMobileAppView = IS_IOS || isNativeAndroidApp'));
  assert.ok(app.includes('/Android/i.test(navigator.userAgent)'));
  assert.ok(app.includes('{!isMobileAppView && ('));
  assert.ok(app.includes('className="webPublisherContent"'));
});

test('native iOS speech explicitly activates playback and has failure visibility', () => {
  const swift = read('ios/App/App/SceneDelegate.swift');
  const app = read('src/App.jsx');
  assert.ok(swift.includes('AVAudioSession.sharedInstance()'));
  assert.ok(swift.includes('setCategory(.playback, mode: .spokenAudio'));
  assert.ok(swift.includes('setActive(true)'));
  assert.ok(swift.includes('self.synthesizer.speak(utterance)'));
  assert.ok(app.includes('iOS native speech failed, trying Web Speech'));
});
