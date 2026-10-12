import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const native = readFileSync(new URL('../app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java', import.meta.url), 'utf8');
const cadence = readFileSync(new URL('../app/src/main/java/com/randis2288/dartscorepro/InterstitialCadence.java', import.meta.url), 'utf8');

test('Start counts but never opens an interstitial before game starts', () => {
  const start = app.match(/const markNonX01LobbyStart = \(gameMode\) => \{([\s\S]*?)\n  \};/);
  assert.ok(start, 'markNonX01LobbyStart exists');
  assert.match(start[1], /recordNonX01Start\(gameMode\)/);
  assert.doesNotMatch(start[1], /showNonX01AfterGameBoundary|non_x01_boundary/);
  const nativeStart = native.match(/private void recordNonX01LobbyStartInternal\(String mode\) \{([\s\S]*?)\n    \}/);
  assert.ok(nativeStart);
  assert.match(nativeStart[1], /InterstitialCadence\.recordNonX01Start/);
  assert.doesNotMatch(nativeStart[1], /startActivity|showNonX01AfterGameBoundary/);
});

test('All non-X01 interstitials are requested only after Repeat or either Back', () => {
  const repeat = app.match(/const restartGame = \(\) => \{([\s\S]*?)\n  \};/);
  assert.ok(repeat);
  assert.match(repeat[1], /startGame\(false\)/);
  assert.match(repeat[1], /requestNonX01InterstitialAfterBoundary\(\)/);

  const back = app.match(/const returnToLobbyFromGame = \(\) => \{([\s\S]*?)\n    \};/);
  assert.ok(back);
  assert.match(back[1], /requestNonX01InterstitialAfterBoundary\(\)/);
  assert.match(app, /onClick=\{returnToLobbyFromGame\}/);
  assert.match(app, /onClick=\{\(\) => setScreen\('lobby'\)\}/);
  assert.match(app, /if \(scr === 'lobby'\) \{\s*returnToLobbyFromGame\(\)/);
  assert.match(app, /onClick=\{restartGame\}/);
});

test('Three starts shared across non-X01; cooldown and no-fill retain eligibility', () => {
  assert.match(cadence, /getInt\(OTHER_GAME_COUNT, 0\) < 3/);
  assert.match(cadence, /Math\.min\(3, count \+ 1\)/);
  assert.match(cadence, /now - last >= MIN_GAP_MS/);
  const shown = cadence.match(/static synchronized void markShown\(Context context\) \{([\s\S]*?)\n    \}/);
  assert.ok(shown);
  assert.match(shown[1], /putInt\(OTHER_GAME_COUNT, 0\)/);
  assert.match(native, /showNonX01AfterGameBoundaryInternal\(String mode\)/);
  assert.match(native, /InterstitialCadence\.shouldShowNonX01Boundary\(this\)/);
  assert.match(native, /"non_x01_boundary"/);
});

test('Review dialog is not triggered by a game ending or Back', () => {
  const back = app.match(/const returnToLobbyFromGame = \(\) => \{([\s\S]*?)\n    \};/);
  assert.ok(back);
  assert.doesNotMatch(back[1], /maybeShowReviewPrompt/);
  assert.match(app, /isReviewAdQuietPeriodOver\(lastAdAt\)/);
  assert.match(app, /REVIEW_FRESH_LOBBY_DELAY_MS = 10 \* 1000/);
});
