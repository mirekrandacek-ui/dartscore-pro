import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isReviewAdQuietPeriodOver, REVIEW_AD_QUIET_MS, canShowReviewPrompt, onAppLaunch, onGameCompleted } from '../src/reviewPrompt.js';

test('after a full-screen ad the review prompt is suppressed for one hour', () => {
  const adAt = 1_700_000_000_000;
  assert.equal(isReviewAdQuietPeriodOver(adAt, adAt), false);
  assert.equal(isReviewAdQuietPeriodOver(adAt, adAt + 5 * 60 * 1000), false);
  assert.equal(isReviewAdQuietPeriodOver(adAt, adAt + REVIEW_AD_QUIET_MS - 1), false);
  assert.equal(isReviewAdQuietPeriodOver(adAt, adAt + REVIEW_AD_QUIET_MS), true);
});

test('no recent ad means no artificial review quiet-period restriction', () => {
  assert.equal(isReviewAdQuietPeriodOver(0), true);
  assert.equal(isReviewAdQuietPeriodOver(undefined), true);
  assert.equal(isReviewAdQuietPeriodOver('garbage'), true);
});

test('existing five-prompt limit and qualifying positive usage remain unchanged', () => {
  let state = {};
  for (let i = 0; i < 3; i++) state = onAppLaunch(state);
  for (let i = 0; i < 10; i++) state = onGameCompleted(state);
  assert.equal(canShowReviewPrompt(state), true);
  assert.equal(canShowReviewPrompt({...state, promptCount: 5}), false);
});


test('Android native Play review is automatic and never replaces the manual Store link', () => {
  const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const app = read('src/App.jsx');
  const java = read('app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java');
  const gradle = read('app/build.gradle');

  const start = app.indexOf('const maybeShowReviewPrompt = () => {');
  const end = app.indexOf('\n  useEffect(() => {', start);
  assert.ok(start >= 0 && end > start, 'automatic rating eligibility hook exists');
  const auto = app.slice(start, end);

  assert.match(gradle, /com\.google\.android\.play:review:2\.0\.2/);
  assert.match(auto, /window\.DartScoreAndroid\?\.requestInAppReview/);
  assert.match(auto, /window\.DartScoreAndroid\.requestInAppReview\(\)/);
  assert.ok(auto.indexOf('window.DartScoreAndroid.requestInAppReview()') <
    auto.indexOf('setShowReviewPrompt(true)'), 'native Android path bypasses custom modal');
  assert.match(auto, /isReviewAdQuietPeriodOver\(lastAdAt\)/);
  assert.match(auto, /canShowReviewPrompt\(state\)/);

  assert.match(java, /ReviewManagerFactory\.create\(this\)/);
  assert.match(java, /manager\.requestReviewFlow\(\)/);
  assert.match(java, /manager\.launchReviewFlow\(this, info\)/);
  assert.match(java, /document\.querySelector\('\.lobbyWrap'\)/);
  assert.match(java, /!"true"\.equals\(stillIdle\)/);
  assert.match(java, /public void requestInAppReview\(\)/);
  assert.match(java, /MainWebViewActivity\.this::requestInAppReviewNative/);

  const manual = java.match(/public void rateApp\(\) \{([^}]*)\}/);
  assert.ok(manual, 'manual rating bridge stays present');
  assert.match(manual[1], /openStoreListingNative/);
  assert.doesNotMatch(manual[1], /requestInAppReviewNative/);
});
