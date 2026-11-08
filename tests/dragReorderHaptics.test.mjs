import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const android = await readFile(new URL('../app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java', import.meta.url), 'utf8');

test('long-press drag uses the same globally gated haptic action as score keys', () => {
  assert.match(app, /const playKeyHaptic = \(\) => \{\s*if \(!hapticsOn\) return;/);
  assert.match(app, /<Lobby[\s\S]*?playKeyHaptic=\{playKeyHaptic\}/);
  assert.match(app, /function Lobby\(\{[\s\S]*?players, setPlayers,\s*playKeyHaptic,/);
  assert.match(app, /drag\.active = true;\s*setDraggingPlayerId\(playerId\);[\s\S]*?playKeyHaptic\(\);/);
});

test('Android WebView does not generate implicit long-press vibration around the toggle', () => {
  assert.match(android, /webView = new WebView\(this\);[\s\S]*?webView\.setHapticFeedbackEnabled\(false\);/);
  assert.match(android, /public void hapticTap\(\)/);
});
