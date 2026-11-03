import Foundation

func permits(updated: Bool = true, obtained: Bool = true, gdpr: Int? = 1,
             purposes: String? = "1000001000", ac: String? = "2~89~dv.123",
             att: Bool = true) -> Bool {
    MetaConsentPolicy.allowsMeasurement(updated: updated, obtained: obtained,
                                       gdprApplies: gdpr, purposes: purposes,
                                       additionalConsent: ac, trackingAuthorized: att)
}

precondition(permits())
precondition(permits(ac: "1~12.89.123"))
precondition(!permits(updated: false))
precondition(!permits(obtained: false))
precondition(!permits(gdpr: nil))
precondition(!permits(gdpr: 0))
precondition(!permits(att: false))
precondition(!permits(purposes: nil))
precondition(!permits(purposes: "0000001000"))
precondition(!permits(purposes: "1000000000"))
precondition(!permits(purposes: "111111111"))
precondition(!permits(purposes: "111111111x"))
precondition(!permits(ac: nil))
precondition(!permits(ac: "2~~dv.89"))
precondition(!permits(ac: "2~189.890~dv.89"))
precondition(!permits(ac: "3~89"))
precondition(!permits(ac: "2~89x"))
precondition(!permits(ac: "2~.89"))
print("Meta consent policy: 19 cases passed")
