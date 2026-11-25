import Foundation

// Internal normalized states: 1 = notRequired, 3 = obtained; not UMP raw values.
// Firebase permission is independent of advertising eligibility and ATT.
enum FirebaseConsentPolicy {
    static func analytics(status: Int, mode: String?) -> Bool {
        guard status == 1 || status == 3, let mode = mode,
              mode.count == 4, mode.allSatisfy({ "01234".contains($0) }) else { return false }
        let value = Array(mode)[3]
        return value == "1" || (status == 1 && value == "3")
    }
    static func crashes(status: Int, mode: String?, publisher: String?) -> Bool {
        if status == 1 {
            return analytics(status: status, mode: mode) && mode?.last == "3"
        }
        guard status == 3, let publisher = publisher,
              (10...24).contains(publisher.count),
              publisher.allSatisfy({ $0 == "0" || $0 == "1" }) else { return false }
        let bits = Array(publisher)
        return bits[0] == "1" && bits[9] == "1"
    }
}
