import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const app = read('src/App.jsx');
const main = read('app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java');
const manifest = read('app/src/main/AndroidManifest.xml');

const start = app.indexOf('async function showInterstitialAd(eventDetails) {');
const end = app.indexOf('/* ===== MAIN APP ===== */', start);
assert.ok(start > 0 && end > start, 'interstitial JS function located');

function makeInterstitialHarness({ native = true } = {}) {
  const events = [];
  const window = { location: { href: 'https://dartscore-pro.vercel.app/' } };
  if (native) {
    window.DartScoreAndroid = {
      requestInterstitialEvent: query => events.push(query)
    };
  }
  const context = {
    window, navigator: { userAgent: 'Android WebView' }, URLSearchParams,
    IS_IOS: false, ADMOB_INTERSTITIAL_SCHEME_URL: 'dartscorepro://show-interstitial',
    recordFullscreenAdRequest: () => events.push('recorded'),
    console
  };
  const callback = vm.runInNewContext(app.slice(start, end) + '\nshowInterstitialAd', context);
  return { events, window, callback };
}

test('Android native X01 victory sends its completed event without navigating WebView', async () => {
  const { events, window, callback } = makeInterstitialHarness();
  const url = window.location.href;
  assert.equal(await callback({ ad_event: 'completed', mode: 'classic', score: 501, legs: 1, sets: 1 }), true);
  assert.equal(window.location.href, url, 'winning game must remain on its own WebView page');
  assert.deepEqual(events, ['recorded', 'ad_event=completed&mode=classic&score=501&legs=1&sets=1']);
});

test('Android TWA fallback retains the typed deep link', async () => {
  const { window, callback } = makeInterstitialHarness({ native: false });
  assert.equal(await callback({ ad_event: 'completed', mode: 'classic', score: 501 }), true);
  assert.equal(window.location.href, 'dartscorepro://show-interstitial?ad_event=completed&mode=classic&score=501');
});

test('Interstitial host stays in Android task until the SDK completes its ad', () => {
  const adBlock = manifest.match(/<activity\s+android:name="\.AdMobInterstitialActivity"[\s\S]*?<\/activity>/)?.[0];
  assert.ok(adBlock, 'manifest declares ad host');
  assert.doesNotMatch(adBlock, /android:noHistory="true"/);
  assert.match(main, /public void requestInterstitialEvent\(String encodedQuery\)/);
  assert.match(main, /runOnUiThread\(\(\) -> requestInterstitialEventInternal\(encodedQuery\)\)/);
  assert.match(main, /currentPremiumState \|\| isFinishing\(\)/, 'native bridge must respect Premium');
  assert.match(main, /new Intent\(this, AdMobInterstitialActivity\.class\)\.setData\(uri\)/);
});

test('Native Google in-app review remains available to Free and Premium', () => {
  const reviewStart = app.indexOf('const maybeShowReviewPrompt = () => {');
  const reviewEnd = app.indexOf('  useEffect(() => {', reviewStart);
  const review = app.slice(reviewStart, reviewEnd);
  assert.match(review, /DartScoreAndroid\.requestInAppReview\(\)/);
  assert.doesNotMatch(review, /if\s*\(\s*!?isPremium\s*\)/);
});

test('Completion Analytics stays in the game instead of racing the ad with a second deep link', () => {
  const source = read('src/analyticsEvents.js');
  const first = source.indexOf('const sendNativeAnalyticsEvent = (');
  const last = source.indexOf('const markGameStarted = (', first);
  assert.ok(first >= 0 && last > first);
  const calls = [];
  const window = {
    DartScoreAndroid: { logAnalyticsEvent: event => calls.push(event) },
    location: { href: 'https://dartscore-pro.vercel.app/' }
  };
  const context = { window, URLSearchParams, setTimeout: () => { throw Error('unexpected legacy navigation'); } };
  const send = vm.runInNewContext(source.slice(first, last) + '\nsendNativeAnalyticsEvent', context);
  send('game_completed', { game_type: 'classic', plan_tier: 'free' });
  send('premium_purchase_completed', { product_id: 'premium_unlock' }, true);
  assert.deepEqual(calls, [
    'analytics_event=game_completed&game_type=classic&plan_tier=free',
    'analytics_event=premium_purchase_completed&product_id=premium_unlock'
  ]);
  assert.equal(window.location.href, 'https://dartscore-pro.vercel.app/');
  assert.match(main, /public void logAnalyticsEvent\(String encodedQuery\)/);
  assert.match(main, /AdMobInterstitialActivity\.handleAnalyticsIntent\(this, uri\)/);
});
