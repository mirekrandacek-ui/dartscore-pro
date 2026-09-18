const ANALYTICS_ACTIVE_KEY = 'dspAnalyticsGameActive';
const ANALYTICS_STARTED_AT_KEY = 'dspAnalyticsGameStartedAt';

const safeJson = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const currentPlanTier = () => {
  try {
    return localStorage.getItem('premium') === 'true' ? 'premium' : 'free';
  } catch {
    return 'free';
  }
};

const participantCount = (snapshotOrRecord) => {
  const players = snapshotOrRecord?.players;
  return Array.isArray(players) ? players.length : 0;
};

const progressOf = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return 0;
  const actions = Array.isArray(snapshot.actions) ? snapshot.actions.length : 0;
  const thrown = Array.isArray(snapshot.thrown)
    ? snapshot.thrown.reduce((sum, value) => sum + (Number(value) || 0), 0)
    : 0;
  return actions + thrown;
};

const gameSignature = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return '';
  const players = Array.isArray(snapshot.players)
    ? snapshot.players.map(player => player?.id || player?.name || '').join('|')
    : '';
  return [
    snapshot.mode || 'unknown',
    snapshot.startScore || '',
    snapshot.playerMode || '',
    players
  ].join('::');
};

const sendNativeAnalyticsEvent = (eventName, params = {}) => {
  try {
    if (!window.DartScoreAndroid) return;

    const query = new URLSearchParams();
    query.set('analytics_event', eventName);

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      query.set(key, String(value));
    });

    const url = `dartscorepro://show-interstitial?${query.toString()}`;
    setTimeout(() => {
      try {
        window.location.href = url;
      } catch { }
    }, 0);
  } catch { }
};

const markGameStarted = (snapshot, isResume = false) => {
  const now = Date.now();
  try {
    sessionStorage.setItem(ANALYTICS_ACTIVE_KEY, gameSignature(snapshot) || 'active');
    sessionStorage.setItem(ANALYTICS_STARTED_AT_KEY, String(now));
  } catch { }

  sendNativeAnalyticsEvent('game_started', {
    game_type: snapshot?.mode || 'unknown',
    player_count: participantCount(snapshot),
    player_mode: snapshot?.playerMode || 'individual',
    plan_tier: currentPlanTier(),
    start_score: snapshot?.mode === 'classic' ? snapshot?.startScore : undefined,
    ai_level: snapshot?.ai && snapshot.ai !== 'off' ? snapshot.ai : undefined,
    is_resume: isResume ? 1 : 0
  });
};

const markGameAbandoned = (snapshot, reason = 'new_game') => {
  let durationSec;
  try {
    const startedAt = Number(sessionStorage.getItem(ANALYTICS_STARTED_AT_KEY));
    if (Number.isFinite(startedAt) && startedAt > 0) {
      durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    }
  } catch { }

  sendNativeAnalyticsEvent('game_abandoned', {
    game_type: snapshot?.mode || 'unknown',
    player_count: participantCount(snapshot),
    player_mode: snapshot?.playerMode || 'individual',
    plan_tier: currentPlanTier(),
    start_score: snapshot?.mode === 'classic' ? snapshot?.startScore : undefined,
    ai_level: snapshot?.ai && snapshot.ai !== 'off' ? snapshot.ai : undefined,
    duration_sec: durationSec,
    abandon_reason: reason,
    progress: progressOf(snapshot)
  });
};

const markGameCompleted = (record) => {
  let durationSec;
  try {
    const startedAt = Number(sessionStorage.getItem(ANALYTICS_STARTED_AT_KEY));
    if (Number.isFinite(startedAt) && startedAt > 0) {
      durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    }
  } catch { }

  sendNativeAnalyticsEvent('game_completed', {
    game_type: record?.mode || 'unknown',
    player_count: participantCount(record),
    player_mode: record?.playerMode || 'individual',
    plan_tier: currentPlanTier(),
    start_score: record?.mode === 'classic' ? record?.startScore : undefined,
    duration_sec: durationSec
  });

  try {
    sessionStorage.removeItem(ANALYTICS_ACTIVE_KEY);
    sessionStorage.removeItem(ANALYTICS_STARTED_AT_KEY);
  } catch { }
};

if (typeof window !== 'undefined') {
  window.DartScoreAnalytics = {
    abandonGame(snapshot, reason = 'new_game') {
      if (!snapshot || snapshot.winner != null || progressOf(snapshot) <= 0) return false;
      markGameAbandoned(snapshot, reason);
      return true;
    }
  };
}

const installStorageAnalytics = () => {
  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = function patchedSetItem(key, value) {
    let oldValue = null;
    let isLocalStorage = false;

    try {
      isLocalStorage = this === window.localStorage;
      if (isLocalStorage && (key === 'savedGame' || key === 'finishedGames')) {
        oldValue = this.getItem(key);
      }
    } catch { }

    const result = originalSetItem.call(this, key, value);

    if (!isLocalStorage) return result;

    try {
      if (key === 'savedGame') {
        const previous = safeJson(oldValue);
        const next = safeJson(value);
        if (!next || next.screen !== 'game') return result;

        const previousProgress = progressOf(previous);
        const nextProgress = progressOf(next);
        const previousSignature = gameSignature(previous);
        const nextSignature = gameSignature(next);

        let activeSignature = '';
        try {
          activeSignature = sessionStorage.getItem(ANALYTICS_ACTIVE_KEY) || '';
        } catch { }

        const firstActiveGame = !activeSignature;
        const resetAfterProgress = previousProgress > 0 && nextProgress === 0;
        const switchedGame = previousSignature && nextSignature && previousSignature !== nextSignature && nextProgress === 0;

        if (firstActiveGame || resetAfterProgress || switchedGame) {
          markGameStarted(next, nextProgress > 0);
        }
      }

      if (key === 'finishedGames') {
        const previousList = safeJson(oldValue, []);
        const nextList = safeJson(value, []);
        const previousFirstTs = Array.isArray(previousList) ? previousList?.[0]?.ts : null;
        const nextRecord = Array.isArray(nextList) ? nextList?.[0] : null;

        if (nextRecord?.ts && nextRecord.ts !== previousFirstTs) {
          markGameCompleted(nextRecord);
        }
      }
    } catch { }

    return result;
  };
};

installStorageAnalytics();
