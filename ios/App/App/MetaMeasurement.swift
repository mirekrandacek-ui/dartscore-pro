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

    func becameActive() {
        // An ATT system sheet temporarily makes the scene inactive. Re-check on
        // its dismissal without resetting the freshly obtained UMP choice.
        guard updated else { return }
        finish { _ in }
    }

    func suspend() {
        updated = false
        activatedThisForeground = false
        if initialized {
            Settings.shared.isAutoLogAppEventsEnabled = false
            Settings.shared.isAdvertiserIDCollectionEnabled = false
            Settings.shared.isSKAdNetworkReportEnabled = false
            AppEvents.shared.flushBehavior = .explicitOnly
        }
    }

    func prepare(from controller: UIViewController, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        suspend()
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
        suspend()
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
        // Ask ATT only after a specific Meta measurement choice, never to override
        // a refused/unknown CMP choice. No additional custom consent dialog.
        if allowed(trackingAuthorized: true), ATTrackingManager.trackingAuthorizationStatus == .notDetermined,
           UIApplication.shared.applicationState == .active {
            ATTrackingManager.requestTrackingAuthorization { _ in
                DispatchQueue.main.async { self.finish(completion: completion) }
            }
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
