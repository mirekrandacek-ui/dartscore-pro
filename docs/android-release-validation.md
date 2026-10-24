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

## Android 15/16 Play Console findings implemented for v104 (1.1.70)

1. Edge-to-edge and display cutouts: AndroidX WindowCompat + WindowInsetsCompat, margins for web content and AdMob banner, no double CSS safe-area padding in native WebView.
2. Deprecated window bar methods: Android Browser Helper upgraded to 2.7.4; old WebViewFallbackActivity manifest registration removed; native app uses compatibility APIs.
3. Android 16 large screens: removed fixed portrait declarations for ConsentLauncher, MainWebView and TWA launcher; enabled resizable activities; verified landscape tablet virtual display, no horizontal overflow.
4. Optimization: Android Gradle Plugin 9.3.3 + Gradle 9.5.0, R8 optimized code/resource shrinking enabled.

### Release-startup regression discovered and fixed

Initial optimized APK crashed before startup inside AndroidX WorkManager due to
R8 removing the zero-argument constructor of Room-generated WorkDatabase_Impl.
The narrowly scoped keep file `app/src/main/keepRules/workmanager-room.keep`
prevents that removal. **Do not remove it without proving optimized release startup.**

QA evidence obtained locally:
- 31 existing/new Node tests passed before the keep rule was added.
- Real Android 16 emulated Free app resumed after Analytics and an interstitial attempt (the emulator did not receive a filled third-party ad).
- Emulated landscape tablet width 1280px: document scrollWidth 1280px, native insets active, no crash.
- Optimized Android 16 release APK startup: passed after the R8 keep rule, app displayed MainWebViewActivity, no FATAL EXCEPTION.
- Signed v104 AAB certificate equals v103 certificate.
- CI workflow includes Android 15/16 emulators, optimized release startup, and temporary CI signing only; **the QA key is not the production upload key**.

Note: only Play Console analysis of the new uploaded AAB can show whether all four recommendations disappear. An AAB build and automated smoke test cannot prove a filled Unity/Meta advertisement works.
