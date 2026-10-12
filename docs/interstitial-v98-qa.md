# DartScore Pro v98 — interstitial QA before internal release

Implementation branch: `feature/v98-x01-interstitial-5m`. DO NOT publish before device QA.

## Core acceptance scenarios

1. Free **101, 1 leg / 1 set**: finish a match three times. First two = no interstitial. Third = one interstitial after the fanfare, provided an ad is loaded and the 5-minute cooldown has expired.
2. Free **301, 1/1**: same cadence and counter as 101. Verify 101 → 301 → 101 also triggers on the third counted match.
3. Free 101/301 **Repeat** after one score, no checkout: count one game; three such games should trigger one interstitial. Repeat without entering any score must not count.
4. Free 101/301 **Back → Start** after a score: count one game; do not double-count when starting again from the lobby. Back without any score must not count.
5. Free 101/301 **with additional legs or sets**: no ad after intermediate leg; one eligible request only on the entire finished match. Abandon/Repeat must NOT count.
6. Free **501, 701 and 901** with one or multiple legs/sets: each entire completed match is eligible, never intermediate legs and never a merely abandoned match.
7. **Cross-mode 5-minute gap**: after a displayed 501 interstitial, a finished 701 within five minutes does not show another. Retry on a subsequent qualifying result after five minutes.
8. **No-fill / consent unavailable / failure-to-show**: the quick-game count and cooldown are NOT reset. Next qualifying event should be eligible again.
9. **Persistence**: play two quick matches, fully terminate the Android app, relaunch, play one more quick match. Expect one eligible ad. Repeat with the app terminated during the winner fanfare and confirm the pending match counts at the next game boundary.
10. **Premium**: no interstitial. No unrelated Premium behavior or purchases altered.
11. **Non-X01** Cricket, Around, Roulette: retain existing three-lobby-start pending logic, but respect global cooldown.
12. **Analytics event intents**: `analytics_event` must log an Analytics event, not show a fullscreen ad.
13. iOS: confirm the same cadence, five-minute local cooldown, successful-show reset and no-fill retry in TestFlight. Android and iOS do not share a single device counter.
14. Test with **both TWA and Android WebView fallback**, where available.

## Verification in this change

The Node policy tests cover supported scores, 101/301 quick match classification, zero recorded scores, partly entered scores and longer formats.
A phone/test-ad run and signed Android App Bundle build have **not** been performed by this change.
