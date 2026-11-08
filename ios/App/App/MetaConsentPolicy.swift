import Foundation

enum MetaConsentPolicy {
    // Google Additional Consent provider list: 89 = Meta, not TCF vendor 89.
    static func allowsMeasurement(updated: Bool, obtained: Bool, gdprApplies: Int?,
                                  purposes: String?, additionalConsent: String?,
                                  trackingAuthorized: Bool) -> Bool {
        guard updated, obtained, gdprApplies == 1, trackingAuthorized,
              let purposes = purposes, purposes.count == 10,
              purposes.allSatisfy({ $0 == "0" || $0 == "1" }),
              purposes.first == "1", Array(purposes)[6] == "1",
              let additionalConsent = additionalConsent else { return false }
        let parts = additionalConsent.split(separator: "~", omittingEmptySubsequences: false)
        guard parts.count >= 2, parts[0] == "1" || parts[0] == "2" else { return false }
        // The optional dv. section means disclosed, not consented.
        let consented = parts[1].split(separator: ".", omittingEmptySubsequences: false)
        guard consented.allSatisfy({ !$0.isEmpty && $0.allSatisfy({ $0.isNumber }) }) else { return false }
        return consented.contains("89")
    }
}
