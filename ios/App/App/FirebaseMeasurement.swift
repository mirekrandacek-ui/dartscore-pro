import Foundation
import FirebaseCore
import FirebaseAnalytics
import FirebaseCrashlytics
import UserMessagingPlatform

// Shares the existing UMP surface; never displays another consent dialog.
final class FirebaseMeasurement {
    static let shared = FirebaseMeasurement()
    private let prefs = UserDefaults.standard
    private let prefix = "dartscore.firebase."
    private var configured = false
    private var resolved = false
    private var analyticsEnabled = false
    private var crashesEnabled = false
    private var generationAtLaunch = 0
    private var processedReports = false
    private var observer: NSObjectProtocol?
    private var applying = false

    func bootstrap() {
        guard !configured else { return }
        // Info.plist blocks collection before configure; preserve existing ATT/Meta setup.
        FirebaseApp.configure()
        configured = true
        generationAtLaunch = prefs.integer(forKey: prefix + "generation")
        pause()
        observer = NotificationCenter.default.addObserver(forName: UserDefaults.didChangeNotification,
                                                         object: prefs, queue: .main) { [weak self] _ in
            self?.revokeIfNeeded()
        }
    }
    private func pause() {
        guard configured else { return }
        analyticsEnabled = false
        Analytics.setAnalyticsCollectionEnabled(false)
        Analytics.setConsent([.analyticsStorage: .denied, .adStorage: .denied,
                              .adUserData: .denied, .adPersonalization: .denied])
        Crashlytics.crashlytics().setCrashlyticsCollectionEnabled(false)
    }
    func suspend() {
        resolved = false
        pause()
    }
    private func permissions() -> (Bool, Bool) {
        // Normalize typed iOS statuses; their raw values differ from Android.
        let status: Int
        switch ConsentInformation.shared.consentStatus {
        case .notRequired: status = 1
        case .obtained: status = 3
        default: status = 0
        }
        let mode = prefs.string(forKey: "UMP_consentModeValues")
        let publisher = prefs.string(forKey: "IABTCF_PublisherConsent")
        return (FirebaseConsentPolicy.analytics(status: status, mode: mode),
                FirebaseConsentPolicy.crashes(status: status, mode: mode, publisher: publisher))
    }
    func resolve(updated: Bool) {
        guard configured else { return }
        guard updated else { suspend(); return }
        resolved = true
        let (analytics, crashes) = permissions()
        apply(analytics: analytics, crashes: crashes)
        processReportsOnce()
    }
    private func revokeIfNeeded() {
        guard configured, resolved, !applying else { return }
        let (analytics, crashes) = permissions()
        // Preference notifications cannot grant consent before UMP finishes.
        if (!analytics && analyticsEnabled) || (!crashes && crashesEnabled) {
            apply(analytics: analyticsEnabled && analytics, crashes: crashesEnabled && crashes)
        }
    }
    private func apply(analytics: Bool, crashes: Bool) {
        applying = true
        defer { applying = false }
        let oldAnalytics = prefs.bool(forKey: prefix + "analytics")
        let oldCrashes = prefs.bool(forKey: prefix + "crashes")
        if oldAnalytics != analytics || oldCrashes != crashes {
            prefs.set(prefs.integer(forKey: prefix + "generation") + 1, forKey: prefix + "generation")
            prefs.set(true, forKey: prefix + "discardNext")
            Crashlytics.crashlytics().deleteUnsentReports()
            if oldAnalytics && !analytics { Analytics.resetAnalyticsData() }
        }
        prefs.set(analytics, forKey: prefix + "analytics")
        prefs.set(crashes, forKey: prefix + "crashes")
        analyticsEnabled = analytics
        crashesEnabled = crashes
        Analytics.setConsent([.analyticsStorage: analytics ? .granted : .denied,
                              .adStorage: .denied, .adUserData: .denied, .adPersonalization: .denied])
        Analytics.setAnalyticsCollectionEnabled(analytics)
        Crashlytics.crashlytics().setCrashlyticsCollectionEnabled(false)
    }
    private func processReportsOnce() {
        guard !processedReports else { return }
        processedReports = true
        let generation = prefs.integer(forKey: prefix + "generation")
        let send = crashesEnabled && !prefs.bool(forKey: prefix + "discardNext")
        let reports = Crashlytics.crashlytics()
        reports.checkForUnsentReports { [weak self] available in
            DispatchQueue.main.async {
                guard let self = self else { return }
                let unchanged = generation == self.prefs.integer(forKey: self.prefix + "generation")
                if available {
                    if send && unchanged && self.resolved && self.crashesEnabled {
                        reports.sendUnsentReports()
                    } else { reports.deleteUnsentReports() }
                }
                // A permission change invalidates the running session at its next launch too.
                if unchanged && generation == self.generationAtLaunch {
                    self.prefs.set(false, forKey: self.prefix + "discardNext")
                }
            }
        }
    }
    func log(event: String, values: [String: Any]) {
        guard resolved, analyticsEnabled else { return }
        revokeIfNeeded()
        guard analyticsEnabled else { return }
        guard let parameters = FirebaseEventPolicy.parameters(event: event, values: values) else { return }
        Analytics.logEvent(event, parameters: parameters)
    }
}
