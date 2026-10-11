import test from 'node:test';
import assert from 'node:assert/strict';
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
