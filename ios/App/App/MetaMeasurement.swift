import UIKit
import AppTrackingTransparency
import UserMessagingPlatform
import FacebookCore
import FBSDKCoreKit

// No SDK initialization at application launch. The existing UMP message is the
// consent surface, for Free and Premium alike. Unknown/error/denied stays off.
final class MetaMeasurement {
    static let shared = MetaMeasurement()
    private var updated = false
    private var initialized = false
    private var activatedThisForeground = false
    private var trackingRequestInFlight = false
    private var pendingTrackingCompletions: [(Bool) -> Void] = []

    func becameActive() {
        // UMP can finish while an iOS sheet is still dismissing. Only ask for
        // ATT when UIKit reports the scene as active; retry after activation.
        startPendingTrackingRequest()
        if updated { finish { _ in } }
    }

    func requestTrackingAuthorizationIfNeeded(completion: @escaping (Bool) -> Void) {
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else {
            completion(ATTrackingManager.trackingAuthorizationStatus == .authorized)
            return
        }
        pendingTrackingCompletions.append(completion)
        startPendingTrackingRequest()
    }

    private func startPendingTrackingRequest() {
        guard !trackingRequestInFlight, !pendingTrackingCompletions.isEmpty,
              UIApplication.shared.applicationState == .active else { return }
        trackingRequestInFlight = true
        ATTrackingManager.requestTrackingAuthorization { status in
            DispatchQueue.main.async {
                self.trackingRequestInFlight = false
                let callbacks = self.pendingTrackingCompletions
                self.pendingTrackingCompletions.removeAll()
                callbacks.forEach { $0(status == .authorized) }
                // A newly authorized choice can now enable explicitly
                // consented Meta measurement, never tracking on denial.
                if self.updated { self.finish { _ in } }
            }
        }
    }

    func suspend() {
        // Keep the consent update for this native app session. Returning from
        // background (or a system dialog) must not force UMP to prompt again.
        // Measurement stays off until the app becomes active and is re-checked.
        activatedThisForeground = false
        if initialized {
            Settings.shared.isAutoLogAppEventsEnabled = false
            Settings.shared.isAdvertiserIDCollectionEnabled = false
            Settings.shared.isSKAdNetworkReportEnabled = false
            AppEvents.shared.flushBehavior = .explicitOnly
        }
    }

    func prepare(from controller: UIViewController, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        // WebView remounts and re-entrant ad requests do not constitute a new
        // native app launch. Ask UMP only once per process; the SDK persists
        // the user's decision across actual launches.
        if updated {
            finish(completion: completion)
            return
        }
        suspend()
        updated = false
        ConsentInformation.shared.requestConsentInfoUpdate(with: RequestParameters()) { error in
            DispatchQueue.main.async {
                if let error = error { completion(.failure(error)); return }
                Task { @MainActor in
                    do {
                        try await ConsentForm.loadAndPresentIfRequired(from: controller)
                        self.updated = true
                        self.evaluate(completion: completion)
                    } catch { completion(.failure(error)) }
                }
            }
        }
    }

    func showOptions(from controller: UIViewController, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        // This is initiated only by the user's Privacy choices button.
        suspend()
        updated = false
        Task { @MainActor in
            do {
                try await ConsentForm.presentPrivacyOptionsForm(from: controller)
                self.updated = true
                self.evaluate(completion: completion)
            } catch { completion(.failure(error)) }
        }
    }

    private func allowed(trackingAuthorized: Bool) -> Bool {
        let defaults = UserDefaults.standard
        return MetaConsentPolicy.allowsMeasurement(
            updated: updated,
            obtained: ConsentInformation.shared.consentStatus == .obtained,
            gdprApplies: (defaults.object(forKey: "IABTCF_gdprApplies") as? NSNumber)?.intValue,
            purposes: defaults.string(forKey: "IABTCF_PurposeConsents"),
            additionalConsent: defaults.string(forKey: "IABTCF_AddtlConsent"),
            trackingAuthorized: trackingAuthorized
        )
    }

    private func evaluate(completion: @escaping (Result<[String: Any], Error>) -> Void) {
        // Meta measurement only requests ATT after explicit UMP opt-in.
        // The separate Free-ads path may also request ATT in non-GDPR regions;
        // both paths share this one native, foreground-safe permission gate.
        if allowed(trackingAuthorized: true) {
            requestTrackingAuthorizationIfNeeded { _ in self.finish(completion: completion) }
        } else {
            finish(completion: completion)
        }
    }

    private func finish(completion: @escaping (Result<[String: Any], Error>) -> Void) {
        let enabled = allowed(trackingAuthorized: ATTrackingManager.trackingAuthorizationStatus == .authorized)
            && UIApplication.shared.applicationState == .active
        if enabled && !activatedThisForeground {
            // No Facebook Login, automatic purchases, codeless events or IDFA collection.
            Settings.shared.isAutoLogAppEventsEnabled = false
            Settings.shared.isAdvertiserIDCollectionEnabled = false
            Settings.shared.isEventDataUsageLimited = true
            Settings.shared.isSKAdNetworkReportEnabled = true
            AppEvents.shared.flushBehavior = .explicitOnly
            if #unavailable(iOS 17) { Settings.shared.isAdvertiserTrackingEnabled = true }
            if !initialized {
                ApplicationDelegate.shared.application(UIApplication.shared, didFinishLaunchingWithOptions: nil)
                initialized = true
            }
            // Meta's activation API handles first-install deduplication. Never
            // synthesize a new "install" event on every application launch.
            AppEvents.shared.activateApp()
            AppEvents.shared.flush()
            activatedThisForeground = true
        }
        completion(.success([
            "canRequestAds": ConsentInformation.shared.canRequestAds,
            "privacyOptionsRequired": ConsentInformation.shared.privacyOptionsRequirementStatus == .required,
            "measurementEnabled": enabled
        ]))
    }
}
