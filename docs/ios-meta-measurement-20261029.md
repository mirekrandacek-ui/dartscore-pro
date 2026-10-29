# iOS Meta measurement candidate — 29 October 2026

Status: local implementation, NOT an iOS build or release approval.

Base: ded543bc1a425812a548dfe8201eca89233417b3, the build-8 iOS branch
test/ios-input-focus-20261018. The local statistics WIP and Android checkout
were not changed. Candidate iOS version: 1.1.64 (9).

## Changes

- Direct Xcode SPM dependencies: FacebookCore 18.1.1 and UMP 3.1.0. They are
  outside Capacitor's generated package, so cap sync does not remove them.
- Meta App ID 1714207943552602 and its public SDK client token (not App Secret).
- No launch-time SDK initialization. UMP must finish updating successfully.
- This initial implementation requires the actual Meta Additional Consent
  provider 89, purposes 1 and 7, obtained consent, gdprApplies=1 and authorized
  ATT. Missing, malformed, unknown, non-TCF or denied states do not initialize
  Meta. This intentionally does not measure every installation worldwide.
- Google canRequestAds is used only for Google ads, never to authorize Meta.
- Existing UMP form, no additional custom opt-in dialog. Native iOS privacy
  choices are accessible from the lobby when UMP requires that entry point.
- Free and Premium use the same consent decision. Premium never enables ads.
- Manual activation uses Meta's own first-install deduplication, not a custom
  install event per launch. Auto events, automatic purchases and IDFA collection
  are configured off. SKAdNetwork reports enable only after the consent gate.
- A failed refresh/form invalidates cached consent readiness; JS serializes
  competing startup/banner/privacy requests. Backgrounding suspends readiness.

## Fresh local evidence

- npm test: 25/25 pass, including four new concurrency/failure/withdrawal-cache
  behavior tests for the JavaScript bridge coordinator.
- npm run build: PASS (web bundle only).
- git diff --check excluding dependencies/generated bundle: PASS.
- Info.plist parsed and checked for disabled default measurement settings;
  Xcode project parsed successfully with the xcode package. This is structural
  validation, not a Swift compile.

These do NOT prove the Swift code compiles, SDK network behavior, or paid
attribution. Windows has no Xcode. The manual-only workflow
ios-meta-measurement-check.yml performs the native policy's 19 scenarios and
an unsigned simulator build on macOS. It contains no App Store upload step,
no signing credentials and no campaign operations. It has not been run.

## Required gates before any release or advertising launch

1. Approve uploading the isolated change to a new GitHub branch and running
   only the unsigned macOS check. Do not reuse an automatic upload workflow.
2. Resolve packages and compile; run the actual native consent tests. Inspect
   the simulator app's embedded Info.plist and linked SDKs after cap sync.
3. Verify that the published UMP message specifically covers Meta app ad
   measurement and permits purpose 7; provider consent alone is not proof of
   the published message's scope. Inspect current Meta server-side codeless
   and advanced-matching switches and keep them off for this implementation.
4. Update the public privacy disclosure and review App Store privacy answers
   against the actual SDK's data. Existing policy mentions Google advertising
   partners, but does not explicitly describe the new Meta App Events path.
5. On an isolated iPhone/TestFlight build: clean install, no choice, refusal,
   later acceptance, restart, upgrade, offline/reconnect, and withdrawal;
   test Free and Premium separately. Preserve scores and existing purchases.
6. Network capture must distinguish Google ads from Meta measurement. Confirm
   no Meta initialization before the required choices and no automatic
   purchases/codeless data. Confirm activation is received in the correct
   Meta data source. Do not classify an upgrade as a new paid installation.
7. Important unresolved SDK limitation: explicit-only event flushing and
   disabled auto events are not a public SDK shutdown/cancel-and-purge API.
   Already in-flight requests or previously persisted SDK state after a
   withdrawal are not proven cancelled by this code. Runtime evidence is a
   release gate; do not claim zero further SDK traffic or a completed privacy
   audit from this patch. Fix any observed post-withdrawal transmission before
   release, rather than silently accepting it.
8. Only after explicit approval: signed build/TestFlight, native runtime QA,
   then App Store submission/release. Meta may take days to recognize the
   updated SDK. Recheck the selectable iOS app and campaign configuration.
9. Ads stay off. Android/iOS spending split is not finalized. Preserve the
   approved 700 CZK total over seven days; do not publish temporary iOS drafts.

Adjacent finding, unchanged: the build-8 App.jsx references IOS_ADS_CONFIGURED
without a declaration in its iOS banner effect. This already exists in the
base and is outside the Meta measurement patch. Native Free/Premium startup
QA must account for it before release; a successful Vite build does not catch
an undeclared variable evaluated only on an iPhone.

## Primary references checked

- https://github.com/facebook/facebook-ios-sdk/releases/tag/v18.1.1
- https://github.com/facebook/facebook-ios-sdk/blob/v18.1.1/FBSDKCoreKit/FBSDKCoreKit/ApplicationDelegate.swift
- https://github.com/facebook/facebook-ios-sdk/blob/v18.1.1/FBSDKCoreKit/FBSDKCoreKit/Settings.swift
- https://github.com/facebook/facebook-ios-sdk/blob/v18.1.1/FBSDKCoreKit/FBSDKCoreKit/include/FBSDKAppEvents.h
- https://developers.google.com/admob/ios/privacy/gdpr
- https://storage.googleapis.com/tcfac/additional-consent-providers.csv
  (live CSV: 89,"Meta","https://www.facebook.com/about/privacy/update",...)
