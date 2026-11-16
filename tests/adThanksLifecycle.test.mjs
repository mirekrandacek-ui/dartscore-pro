import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const java = readFileSync(new URL('../app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java', import.meta.url), 'utf8');
const manager = readFileSync(new URL('../app/src/main/java/com/randis2288/dartscorepro/AdMobInterstitialManager.java', import.meta.url), 'utf8');
const cadence = readFileSync(new URL('../app/src/main/java/com/randis2288/dartscorepro/InterstitialCadence.java', import.meta.url), 'utf8');

test('native Android return signals the page without touching the ad cadence', () => {
  assert.match(java, /window\.dispatchEvent\(new Event\('dartscore-native-resume'\)\)/);
  assert.match(app, /window\.addEventListener\('dartscore-native-resume', onReturn\)/);
  assert.match(app, /getLastInterstitialShownAt/);
  assert.match(app, /at <= lastAndroidAdShownAtRef\.current/);
});

test('Android thanks is based on actual ad display, never request or no-fill', () => {
  assert.match(manager, /onAdShowedFullScreenContent\(\)\s*\{\s*markDisplayedOnce\(\)/);
  assert.match(manager, /onAdDismissedFullScreenContent\(\)/);
  assert.match(cadence, /static synchronized void markShown\(Context context\)/);
  assert.match(java, /getLastInterstitialShownAt\(\)/);
  assert.match(app, /Date\.now\(\) - at < 120000/);
});

test('iOS thanks only follows confirmed display and dismissal', () => {
  assert.match(app, /InterstitialAdPluginEvents\.Showed/);
  assert.match(app, /InterstitialAdPluginEvents\.Dismissed/);
  assert.match(app, /if \(actuallyShown\) showAdThanks\(\)/);
  assert.match(app, /if \(isPremium\) return;/);
});

test('thanks is unobtrusive and distinct from the existing success toast', () => {
  assert.match(app, /className="ad-thanks-toast" role="status" aria-live="polite"/);
  assert.match(app, /window\.setTimeout\(\(\) => setAdThanks\(null\), 4200\)/);
  const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
  assert.match(css, /\.ad-thanks-toast[\s\S]*?pointer-events: none;/);
});
