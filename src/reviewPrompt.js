export const REVIEW_MAX_PROMPTS = 5;

export const REVIEW_DELAYS = [
  { days: 7, games: 10 },
  { days: 14, games: 15 },
  { days: 30, games: 20 },
  { days: 60, games: 25 }
];

export const defaultReviewState = () => ({
  done: false,
  promptCount: 0,
  launchCount: 0,
  completedGames: 0,
  lastPromptAt: 0,
  lastPromptCompletedGames: 0
});

export const normalizeReviewState = (raw = {}) => ({
  done: raw?.done === true,
  promptCount: Math.min(REVIEW_MAX_PROMPTS, Math.max(0, Number(raw?.promptCount) || 0)),
  launchCount: Math.max(0, Number(raw?.launchCount) || 0),
  completedGames: Math.max(0, Number(raw?.completedGames) || 0),
  lastPromptAt: Math.max(0, Number(raw?.lastPromptAt) || 0),
  lastPromptCompletedGames: Math.max(0, Number(raw?.lastPromptCompletedGames) || 0)
});

export const onAppLaunch = (state) => {
  const s = normalizeReviewState(state);
  return { ...s, launchCount: s.launchCount + 1 };
};

export const onGameCompleted = (state) => {
  const s = normalizeReviewState(state);
  return { ...s, completedGames: s.completedGames + 1 };
};

export const canShowReviewPrompt = (state, now = Date.now()) => {
  const s = normalizeReviewState(state);
  if (s.done || s.promptCount >= REVIEW_MAX_PROMPTS) return false;
  if (s.launchCount < 3 || s.completedGames < 10) return false;
  if (s.promptCount === 0) return true;

  const delay = REVIEW_DELAYS[s.promptCount - 1];
  if (!delay) return false;

  const elapsedMs = Math.max(0, Number(now) - s.lastPromptAt);
  const requiredMs = delay.days * 24 * 60 * 60 * 1000;
  const gamesSincePrompt = s.completedGames - s.lastPromptCompletedGames;

  return elapsedMs >= requiredMs && gamesSincePrompt >= delay.games;
};

export const onPromptShown = (state, now = Date.now()) => {
  const s = normalizeReviewState(state);
  return {
    ...s,
    promptCount: Math.min(REVIEW_MAX_PROMPTS, s.promptCount + 1),
    lastPromptAt: Number(now) || Date.now(),
    lastPromptCompletedGames: s.completedGames
  };
};

export const onReviewDone = (state) => ({
  ...normalizeReviewState(state),
  done: true
});
