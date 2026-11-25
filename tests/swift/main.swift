import Foundation
var checks = 0
func verify(_ actual: Bool, _ expected: Bool, _ name: String) {
    precondition(actual == expected, name); checks += 1
}
for status in [0, 2, 4] {
    verify(FirebaseConsentPolicy.analytics(status: status, mode: "1111"), false, "unresolved analytics")
    verify(FirebaseConsentPolicy.crashes(status: status, mode: "1111", publisher: "10000000010"), false, "unresolved crash")
}
for mode: String? in [nil, "", "111", "11111", "1115", "abcd", "2222", "4444"] {
    verify(FirebaseConsentPolicy.analytics(status: 3, mode: mode), false, "bad or denied analytics")
}
verify(FirebaseConsentPolicy.analytics(status: 3, mode: "2221"), true, "analytics independent of ads")
verify(FirebaseConsentPolicy.analytics(status: 1, mode: "3333"), true, "regional analytics default")
verify(FirebaseConsentPolicy.analytics(status: 3, mode: "3333"), false, "not applicable is not EU grant")
for publisher: String? in [nil, "", "111", "00000000000", "10000000000", "00000000010", "100000000x0"] {
    verify(FirebaseConsentPolicy.crashes(status: 3, mode: "1111", publisher: publisher), false, "missing own purposes")
}
verify(FirebaseConsentPolicy.crashes(status: 3, mode: "2222", publisher: "10000000010"), true, "crashes independent of analytics")
verify(FirebaseConsentPolicy.crashes(status: 1, mode: "3333", publisher: nil), true, "regional crash default")
verify(FirebaseConsentPolicy.crashes(status: 1, mode: "4444", publisher: "10000000010"), false, "unconfigured region")
verify(FirebaseEventPolicy.parameters(event: "purchase", values: [:]) == nil, true, "reject custom purchase")
let payload = FirebaseEventPolicy.parameters(event: "game_started", values: ["game_type": "classic", "player_name": "PRIVATE", "score": 501, "purchase_token": "PRIVATE", "player_mode": "team"])!
verify(payload.count == 2 && payload["player_name"] == nil && payload["score"] == nil, true, "allowlist strips private data")
print("PASS: \(checks) Firebase consent and event policy cases")
