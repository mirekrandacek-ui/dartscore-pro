package com.randis2288.dartscorepro;

import android.content.Context;
import android.content.SharedPreferences;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

/**
 * Consent-gated Crashlytics. Automatic collection is disabled in the manifest, so crashes
 * are written to disk as "unsent reports". After consent is resolved at startup they are
 * either sent or deleted.
 *
 * A "generation" counter is bumped every time the consent choice changes. Reports that were
 * created under an older choice are discarded, so a crash from before consent is never
 * uploaded later.
 */
final class CrashReporting {

    private static final String PREFS = "crash_reporting_consent";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_GENERATION = "generation";
    private static final String KEY_DISCARD_PENDING = "discard_pending";

    private static long startupGeneration = Long.MIN_VALUE;

    private CrashReporting() {
    }

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Remembers the generation seen at process start. Call from Application.onCreate. */
    static synchronized void init(Context context) {
        if (startupGeneration == Long.MIN_VALUE) {
            startupGeneration = prefs(context).getLong(KEY_GENERATION, 0L);
        }
    }

    static boolean isEnabled(Context context) {
        return prefs(context).getBoolean(KEY_ENABLED, false);
    }

    /**
     * Stores a new consent choice. Pending reports are dropped first.
     *
     * @return true if the choice was persisted
     */
    static boolean update(Context context, boolean enabled, boolean bumpGeneration) {
        FirebaseCrashlytics.getInstance().deleteUnsentReports();
        SharedPreferences p = prefs(context);
        return p.edit()
            .putBoolean(KEY_ENABLED, enabled)
            .putLong(KEY_GENERATION, p.getLong(KEY_GENERATION, 0L) + (bumpGeneration ? 1L : 0L))
            .putBoolean(KEY_DISCARD_PENDING, bumpGeneration || p.getBoolean(KEY_DISCARD_PENDING, false))
            .commit();
    }

    /** Sends or deletes reports left from the previous run. Call once per process, after consent. */
    static void processUnsentReports(Context context) {
        final Context app = context.getApplicationContext();
        final FirebaseCrashlytics crashlytics = FirebaseCrashlytics.getInstance();
        final SharedPreferences p = prefs(app);
        final long generation = p.getLong(KEY_GENERATION, 0L);
        final boolean allowed = isEnabled(app) && !p.getBoolean(KEY_DISCARD_PENDING, false);

        crashlytics.checkForUnsentReports().addOnSuccessListener(hasReports -> {
            long current = p.getLong(KEY_GENERATION, 0L);
            boolean unchanged = generation == current;

            if (Boolean.TRUE.equals(hasReports)) {
                if (allowed && unchanged && isEnabled(app)) {
                    crashlytics.sendUnsentReports();
                } else {
                    crashlytics.deleteUnsentReports();
                }
            }

            if (unchanged && generation == startupGeneration) {
                p.edit().putBoolean(KEY_DISCARD_PENDING, false).commit();
            }
        });
    }
}
