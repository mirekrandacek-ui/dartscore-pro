# Android release validation — DartScore Pro

## Baseline from internal v103 (1.1.69), 2026-10-19

The project owner completed the entire previously supplied v103 manual checklist:
startup and game flow, Free vs Premium messaging and save/continue behavior,
ads, purchases, voice/settings, and native Play review scenarios.
**Do not ask the owner to repeat this full checklist for every release.**

Critical failure reported while testing Free: after an X01 victory fanfare,
an interstitial flashed very briefly and the Android app spontaneously closed.
This is a release blocker. v103 remains internal-only and is NOT approved for production.

## Regression responsibility for future releases

Before calling ANY release build ready, the assistant/build process must:
1. Verify all previously agreed version-specific tasks (including the four Play Console Android 15/16 findings planned for v104).
2. Run unit tests, frontend compilation and signed Android build.
3. Test the REAL native Android WebView in Android 15 (API 35) and Android 16 (API 36) emulators; include startup, Free victory, analytics, native interstitial event, proper return to the game, and checks for fatal logcat entries.
4. Test Premium ownership with no ads and availability of native Google review in **both** Free and Premium.
5. Where possible, test a filled Google/Unity/Meta interstitial through the actual SDK, including dismissing it and resuming. A no-fill or UMP-blocked emulator smoke test is useful but **is not proof** that a real filled ad cannot crash.
6. Do not promote an AAB to production without explicit owner approval.

## v104 interstitial remediation (in progress)

Avoid simultaneous custom-URI WebView navigations for Firebase Analytics and
interstitial display; use direct JavaScript-to-native bridge calls instead.
Keep the ad host Activity alive under fullscreen SDK overlays, and use explicit
in-package intents for legacy/TWA URI handling. Keep the 5-minute ad cooldown
and Play Review eligibility logic unchanged.

Automated checks:
- `tests/androidInterstitialReturn.test.mjs`
- `qa/android-interstitial-resume.mjs`
- `.github/workflows/android-score-qa.yml` (API 35 and 36)
