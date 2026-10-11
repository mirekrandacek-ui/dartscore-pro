import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const native = readFileSync(new URL('../app/src/main/java/com/randis2288/dartscorepro/InterstitialCadence.java', import.meta.url), 'utf8');
const manager = readFileSync(new URL('../app/src/main/java/com/randis2288/dartscorepro/AdMobInterstitialManager.java', import.meta.url), 'utf8');
const activity = readFileSync(new URL('../app/src/main/java/com/randis2288/dartscorepro/AdMobInterstitialActivity.java', import.meta.url), 'utf8');

test('real SDK show must reserve a global cooldown before calling ad.show()', () => {
  assert.match(native, /5L\s*\*\s*60L\s*\*\s*1000L/);
  assert.match(native, /LAST_ATTEMPT_AT/);
  assert.match(native, /Math\.max\(lastShown, lastAttempt\)/);
  assert.match(native, /static synchronized long claimBeforeAdShow/);
  assert.match(native, /putLong\(LAST_ATTEMPT_AT, now\)\.commit\(\)/);
  assert.ok(manager.indexOf('InterstitialCadence.claimBeforeAdShow') < manager.indexOf('adToShow.show(activity)'));
  assert.match(manager, /if \(claimAt == 0L\)\s*\{[\s\S]*?return false/);
});

test('fail to display does not consume cooldown; a real display persists the timestamp', () => {
  assert.match(native, /static synchronized void releaseFailedShow/);
  assert.match(native, /remove\(LAST_ATTEMPT_AT\)\.commit\(\)/);
  assert.match(manager, /onAdFailedToShowFullScreenContent[\s\S]*?releaseFailedShow/);
  assert.match(manager, /onAdDismissedFullScreenContent\(\)[\s\S]*?markDisplayedOnce\(\)/);
  assert.match(manager, /onAdShowedFullScreenContent\(\)[\s\S]*?markDisplayedOnce\(\)/);
  assert.match(activity, /InterstitialCadence\.markShown/);
});

test('non-X01 boundaries and X01 events use the same global check', () => {
  assert.match(native, /recordAndShouldShow[\s\S]*?cooldownExpired\(prefs, System\.currentTimeMillis\(\)\)/);
  assert.match(native, /shouldShowNonX01Boundary[\s\S]*?cooldownExpired\(prefs, System\.currentTimeMillis\(\)\)/);
  assert.match(native, /\.putLong\(LAST_SHOWN_AT, System\.currentTimeMillis\(\)\)[\s\S]*?\.commit\(\)/);
  assert.match(activity, /InterstitialCadence\.recordAndShouldShow/);
});
