import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  REVIEW_MAX_PROMPTS,
  canShowReviewPrompt,
  defaultReviewState,
  onAppLaunch,
  onGameCompleted,
  onPromptShown,
  onReviewDone
} from '../src/reviewPrompt.js';

const DAY = 24 * 60 * 60 * 1000;
const addLaunches = (state, count) => {
  let s = state;
  for (let i = 0; i < count; i += 1) s = onAppLaunch(s);
  return s;
};
const addGames = (state, count) => {
  let s = state;
  for (let i = 0; i < count; i += 1) s = onGameCompleted(s);
  return s;
};

let now = Date.UTC(2026, 9, 8, 12, 0, 0);
let state = defaultReviewState();

assert.equal(canShowReviewPrompt(state, now), false, 'fresh install must not prompt');
state = addLaunches(state, 3);
state = addGames(state, 9);
assert.equal(canShowReviewPrompt(state, now), false, '9 games must not prompt');
state = addGames(state, 1);
assert.equal(canShowReviewPrompt(state, now), true, '3 launches + 10 games should prompt');

state = onPromptShown(state, now);
assert.equal(state.promptCount, 1);
assert.equal(canShowReviewPrompt(state, now + 30 * DAY), false, 'time alone is not enough');
state = addGames(state, 9);
assert.equal(canShowReviewPrompt(state, now + 7 * DAY), false, 'second prompt needs 10 more games');
state = addGames(state, 1);
assert.equal(canShowReviewPrompt(state, now + 6 * DAY), false, 'second prompt needs 7 days too');
now += 7 * DAY;
assert.equal(canShowReviewPrompt(state, now), true, 'second prompt cadence');

state = onPromptShown(state, now);
state = addGames(state, 15);
assert.equal(canShowReviewPrompt(state, now + 13 * DAY), false);
now += 14 * DAY;
assert.equal(canShowReviewPrompt(state, now), true, 'third prompt cadence');

state = onPromptShown(state, now);
state = addGames(state, 20);
assert.equal(canShowReviewPrompt(state, now + 29 * DAY), false);
now += 30 * DAY;
assert.equal(canShowReviewPrompt(state, now), true, 'fourth prompt cadence');

state = onPromptShown(state, now);
state = addGames(state, 25);
assert.equal(canShowReviewPrompt(state, now + 59 * DAY), false);
now += 60 * DAY;
assert.equal(canShowReviewPrompt(state, now), true, 'fifth prompt cadence');

state = onPromptShown(state, now);
assert.equal(state.promptCount, REVIEW_MAX_PROMPTS);
state = addGames(state, 100);
assert.equal(canShowReviewPrompt(state, now + 365 * DAY), false, 'never prompt after fifth display');

let doneState = addGames(addLaunches(defaultReviewState(), 3), 10);
doneState = onReviewDone(doneState);
assert.equal(canShowReviewPrompt(doneState, now), false, 'rating/no-thanks permanently disables prompt');

console.log('v97 review prompt targeted QA: PASS');


const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
for (const key of ['reviewPromptTitle', 'reviewPromptText', 'reviewNow', 'reviewLater', 'reviewNoThanks']) {
  assert.equal((appSource.match(new RegExp(key + ':', 'g')) || []).length, 7, key + ' must exist in all 7 languages');
}
assert.match(appSource, /recordReviewCompletedGame\(\);/, 'completed games must feed review cadence');
assert.match(appSource, /openRating\('auto_prompt'\)/, 'prompt rating action must use the rating flow');
assert.match(appSource, /const rateApp = \(\) => openRating\('lobby'\);/, 'manual rating must use the same done flag');
assert.match(appSource, /const APP_VERSION = '1\.1\.63';/);
assert.match(appSource, /const LOBBY_DEFAULTS_VERSION = '1\.1\.62';/);

console.log('v97 review prompt integration checks: PASS');
