import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRecordedScore, isQuickClassic, isSupportedX01 } from '../src/interstitialPolicy.js';

test('only supported X01 variants, with no 1001', () => {
  for (const score of [101, 301, 501, 701, 901]) {
    assert.equal(isSupportedX01({ mode: 'classic', startScore: score }), true);
  }
  assert.equal(isSupportedX01({ mode: 'classic', startScore: 1001 }), false);
  assert.equal(isSupportedX01({ mode: 'cricket', startScore: 501 }), false);
});

test('single-match 101 and 301 share the short-game cadence', () => {
  for (const score of [101, 301]) {
    assert.equal(isQuickClassic({ mode: 'classic', startScore: score, legsToWinSet: 1, setsToWin: 1 }), true);
    assert.equal(isQuickClassic({ mode: 'classic', startScore: score, legsToWinSet: 0, setsToWin: 0 }), true);
    assert.equal(isQuickClassic({ mode: 'classic', startScore: score, legsToWinSet: 2, setsToWin: 1 }), false);
    assert.equal(isQuickClassic({ mode: 'classic', startScore: score, legsToWinSet: 1, setsToWin: 2 }), false);
  }
});

test('501, 701, 901 never use the short-match threshold', () => {
  for (const score of [501, 701, 901]) {
    assert.equal(isQuickClassic({ mode: 'classic', startScore: score, legsToWinSet: 1, setsToWin: 1 }), false);
  }
});

test('empty game, Repeat or Back before any score is not progress', () => {
  assert.equal(hasRecordedScore({ startScore: 101, scores: [101, 101], darts: [], thrown: [0, 0], actions: [] }), false);
});

test('a single entered score, including an unfinished turn, is progress', () => {
  assert.equal(hasRecordedScore({ startScore: 101, scores: [101, 101], darts: [{ v: 20 }], thrown: [0, 0] }), true);
  assert.equal(hasRecordedScore({ startScore: 301, scores: [281, 301], darts: [], thrown: [0, 0] }), true);
  assert.equal(hasRecordedScore({ startScore: 301, scores: [301, 301], darts: [], thrown: [3, 0] }), true);
});

test('previously won legs still count as progress within a long match', () => {
  assert.equal(hasRecordedScore({ startScore: 501, scores: [501, 501], classicLegsWon: [1, 0] }), true);
});
