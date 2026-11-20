package com.randis2288.dartscorepro;

/**
 * Pure decision rules: which Firebase features may run for a given UMP state.
 * No Android dependencies, so it can be unit-tested on a plain JVM.
 *
 * Rules reconstructed from the verified 2.09 release (see SPEC-2.09-SOUHLASY.md).
 */
final class UnifiedConsentPolicy {

    /** ConsentInformation.ConsentStatus.NOT_REQUIRED */
    static final int STATUS_NOT_REQUIRED = 1;
    /** ConsentInformation.ConsentStatus.OBTAINED */
    static final int STATUS_OBTAINED = 3;

    static final int ANALYTICS = 0;
    static final int CRASH = 1;

    private UnifiedConsentPolicy() {
    }

    /**
     * @param status          UMP consent status (1 = not required, 2 = required, 3 = obtained)
     * @param consentModeValues value of UMP_consentModeValues (four digits 0-4), may be null
     * @param publisherConsent  value of IABTCF_PublisherConsent (10-24 digits of 0/1), may be null
     * @return {analyticsAllowed, crashReportingAllowed}
     */
    static boolean[] evaluate(int status, String consentModeValues, String publisherConsent) {
        if (status != STATUS_NOT_REQUIRED && status != STATUS_OBTAINED) {
            return new boolean[] {false, false};
        }

        boolean modeValid = consentModeValues != null && consentModeValues.matches("[0-4]{4}");
        char analyticsMode = modeValid ? consentModeValues.charAt(3) : '\0';

        boolean analytics = modeValid
            && (analyticsMode == '1' || (status == STATUS_NOT_REQUIRED && analyticsMode == '3'));

        boolean crash;
        if (status == STATUS_NOT_REQUIRED) {
            crash = modeValid && analyticsMode == '3';
        } else {
            // IAB TCF purposes 1 (store/access information) and 10 (develop and improve products)
            crash = publisherConsent != null
                && publisherConsent.matches("[01]{10,24}")
                && publisherConsent.charAt(0) == '1'
                && publisherConsent.charAt(9) == '1';
        }

        return new boolean[] {analytics, crash};
    }
}
