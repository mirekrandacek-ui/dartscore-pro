#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit("usage: apply-v92-interstitial.py INPUT OUTPUT")

src = Path(sys.argv[1]).read_text(encoding="utf-8")

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

src = replace_once(
    src,
    """    window.location.href = ADMOB_INTERSTITIAL_SCHEME_URL;
    return true;
""",
    """    if (window.DartScoreAndroid?.showInterstitial) {
      window.DartScoreAndroid.showInterstitial();
      return true;
    }

    window.location.href = ADMOB_INTERSTITIAL_SCHEME_URL;
    return true;
""",
    "direct bridge",
)

src = replace_once(
    src,
    """  // Interstitial cadence: a game counts only after at least 3 completed visits.
  // Show one interstitial on Start/Restart after every 3 counted games.
  const playedVisitsRef = useRef(0);
  const playedGamesSinceAdRef = useRef(0);
""",
    """  // Free interstitial cadence:
  // every third explicit Lobby Start arms one interstitial.
  // The count and pending state persist across app restarts.
  const INTERSTITIAL_START_COUNT_KEY = 'interstitialStartCount';
  const INTERSTITIAL_PENDING_KEY = 'interstitialPending';
  const interstitialShowScheduledRef = useRef(false);

  const readInterstitialStartCount = () => {
    try {
      const value = Number.parseInt(
        localStorage.getItem(INTERSTITIAL_START_COUNT_KEY) || '0',
        10
      );
      if (!Number.isFinite(value)) return 0;
      return Math.min(2, Math.max(0, value));
    } catch {
      return 0;
    }
  };

  const isInterstitialPending = () => {
    try {
      return localStorage.getItem(INTERSTITIAL_PENDING_KEY) === 'true';
    } catch {
      return false;
    }
  };

  const markLobbyStartForInterstitial = () => {
    if (isPremium || isInterstitialPending()) return;

    const nextCount = readInterstitialStartCount() + 1;

    try {
      if (nextCount >= 3) {
        localStorage.setItem(INTERSTITIAL_START_COUNT_KEY, '0');
        localStorage.setItem(INTERSTITIAL_PENDING_KEY, 'true');
      } else {
        localStorage.setItem(
          INTERSTITIAL_START_COUNT_KEY,
          String(nextCount)
        );
      }
    } catch { }
  };
""",
    "cadence state",
)

src = replace_once(src, "  const startGame = () => {\n", "  const startGame = (countAsLobbyStart = true) => {\n", "start signature")

src = replace_once(
    src,
    """    const completedVisits = playedVisitsRef.current;
    playedVisitsRef.current = 0;

    if (!isPremium && completedVisits >= 3) {
      playedGamesSinceAdRef.current += 1;

      if (playedGamesSinceAdRef.current >= 3) {
        playedGamesSinceAdRef.current = 0;
        showInterstitialAd();
      }
    }
""",
    """    if (countAsLobbyStart) {
      markLobbyStartForInterstitial();
    }
""",
    "old cadence",
)

src = replace_once(src, "  const restartGame = () => startGame();\n", "  const restartGame = () => startGame(false);\n", "restart")

src = replace_once(
    src,
    """      if (!opts.visitAlreadyCounted) {
        playedVisitsRef.current += 1;
      }

""",
    "",
    "finalize visit counter",
)

src = replace_once(
    src,
    """  playedVisitsRef.current += 1;

  setCurrIdx((i) => {
""",
    """  setCurrIdx((i) => {
""",
    "turn visit counter",
)

src = replace_once(
    src,
    "completeClassicLeg(pendingWinRef.current.pIdx, { visitAlreadyCounted: true });",
    "completeClassicLeg(pendingWinRef.current.pIdx);",
    "playthrough option",
)

anchor = "    const finalizeWin = (pIdx, opts = {}) => {\n"
pos = src.find(anchor)
if pos < 0:
    raise RuntimeError("finalizeWin anchor missing")

helper = """    const showPendingInterstitialAfterFanfare = () => {
      if (isPremium || !isInterstitialPending()) return;
      if (interstitialShowScheduledRef.current) return;

      interstitialShowScheduledRef.current = true;

      let fired = false;
      let fallbackTimer = null;

      const fire = async () => {
        if (fired) return;
        fired = true;

        if (fallbackTimer != null) {
          window.clearTimeout(fallbackTimer);
        }

        const requested = await showInterstitialAd();

        if (requested) {
          try {
            localStorage.setItem(INTERSTITIAL_PENDING_KEY, 'false');
            localStorage.setItem(INTERSTITIAL_START_COUNT_KEY, '0');
          } catch { }
        }

        interstitialShowScheduledRef.current = false;
      };

      const fanfare = soundOn ? winAudioRef.current : null;

      if (!fanfare) {
        window.setTimeout(fire, 250);
        return;
      }

      fanfare.addEventListener(
        'ended',
        () => window.setTimeout(fire, 150),
        { once: true }
      );

      const durationMs =
        Number.isFinite(fanfare.duration) && fanfare.duration > 0
          ? Math.ceil(fanfare.duration * 1000) + 1000
          : 7000;

      fallbackTimer = window.setTimeout(fire, durationMs);
    };

"""
src = src[:pos] + helper + src[pos:]

src = replace_once(
    src,
    """      setWinner(pIdx);

      {
""",
    """      setWinner(pIdx);
      showPendingInterstitialAfterFanfare();

      {
""",
    "show after win",
)

src = replace_once(
    src,
    """              onClick={startGame}
""",
    """              onClick={() => startGame(true)}
""",
    "lobby start",
)

src = replace_once(
    src,
    """  useEffect(() => {
    try {
      if (isPremium) localStorage.setItem('premium', 'true');
    } catch { }
  }, [isPremium]);
""",
    """  useEffect(() => {
    try {
      if (isPremium) {
        localStorage.setItem('premium', 'true');
        localStorage.setItem(INTERSTITIAL_START_COUNT_KEY, '0');
        localStorage.setItem(INTERSTITIAL_PENDING_KEY, 'false');
      }
    } catch { }
  }, [isPremium]);
""",
    "premium pending reset",
)

Path(sys.argv[2]).write_text(src, encoding="utf-8")
