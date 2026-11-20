package com.randis2288.dartscorepro;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

import com.google.android.ump.ConsentInformation;
import com.google.android.ump.UserMessagingPlatform;

import java.util.Map;

/**
 * Single entry point that connects the UMP consent state to Analytics and Crashlytics.
 *
 * Lifecycle:
 *  1. Application.onCreate -> {@link #install}: everything off, listener registered.
 *  2. ConsentLauncher / Diagnostics start -> {@link #block}: collection off while the user decides.
 *  3. Consent resolved -> {@link #arm}: the current UMP state is applied.
 *  4. Later UMP changes (for example withdrawn consent) are applied by the listener,
 *     but the listener can only turn things OFF, never ON.
 */
final class UnifiedConsent {

    private static boolean armed = false;
    private static boolean crashReportsProcessed = false;
    private static boolean applying = false;
    private static SharedPreferences.OnSharedPreferenceChangeListener listener;

    private UnifiedConsent() {
    }

    @SuppressWarnings("deprecation")
    private static SharedPreferences defaultPrefs(Context context) {
        return PreferenceManager.getDefaultSharedPreferences(context.getApplicationContext());
    }

    static synchronized void install(Context context) {
        final Context app = context.getApplicationContext();
        AnalyticsReporting.disableCollection(app);
        CrashReporting.init(app);

        if (listener == null) {
            listener = (prefs, key) -> onPreferenceChanged(app, key);
            defaultPrefs(app).registerOnSharedPreferenceChangeListener(listener);
        }
    }

    /** Called when the user is about to decide (or re-decide). */
    static synchronized void block(Context context) {
        armed = false;
        AnalyticsReporting.disableCollection(context);
    }

    /** Called once the consent flow has finished. */
    static synchronized void arm(Context context) {
        final Context app = context.getApplicationContext();
        armed = true;
        applyCurrentState(app);

        if (!crashReportsProcessed) {
            crashReportsProcessed = true;
            CrashReporting.processUnsentReports(app);
        }
    }

    static synchronized boolean isArmed() {
        return armed;
    }

    /** Re-applies the current consent state, for example when the app returns to the foreground. */
    static synchronized void refresh(Context context) {
        applyCurrentState(context.getApplicationContext());
    }

    private static void applyCurrentState(Context app) {
        if (!armed || applying) {
            return;
        }
        applying = true;
        try {
            boolean[] allowed = evaluate(app);
            AnalyticsReporting.apply(app, allowed[UnifiedConsentPolicy.ANALYTICS], allowed[UnifiedConsentPolicy.CRASH]);
        } finally {
            applying = false;
        }
    }

    private static synchronized void onPreferenceChanged(Context app, String key) {
        if (key == null || !(key.startsWith("IABTCF_") || key.equals("UMP_consentModeValues"))) {
            return;
        }
        if (!armed || applying) {
            return;
        }

        boolean[] allowed = evaluate(app);
        boolean analytics = AnalyticsReporting.isEnabled(app) && allowed[UnifiedConsentPolicy.ANALYTICS];
        boolean crash = CrashReporting.isEnabled(app) && allowed[UnifiedConsentPolicy.CRASH];

        if (analytics != AnalyticsReporting.isEnabled(app) || crash != CrashReporting.isEnabled(app)) {
            applying = true;
            try {
                AnalyticsReporting.apply(app, analytics, crash);
            } finally {
                applying = false;
            }
        }
    }

    private static boolean[] evaluate(Context app) {
        Map<String, ?> all = defaultPrefs(app).getAll();
        ConsentInformation info = UserMessagingPlatform.getConsentInformation(app);

        Object mode = all.get("UMP_consentModeValues");
        Object publisher = all.get("IABTCF_PublisherConsent");

        return UnifiedConsentPolicy.evaluate(
            info.getConsentStatus(),
            mode instanceof String ? (String) mode : null,
            publisher instanceof String ? (String) publisher : null);
    }
}
