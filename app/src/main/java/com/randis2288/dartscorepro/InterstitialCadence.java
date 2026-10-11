package com.randis2288.dartscorepro;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;

/**
 * Native source of truth for interstitial pacing.
 * X01 requests count completed/qualified games; non-X01 starts arm a boundary event.
 * The cooldown and counters survive app restarts and reset only after an ad actually opens.
 */
final class InterstitialCadence {
    private static final String PREFS = "dartscore_interstitial_v2";
    private static final String SHORT_GAME_COUNT = "short_game_count";
    // New counter key intentionally resets stale v100 starts once on upgrading to v101.
    private static final String OTHER_GAME_COUNT = "non_x01_lobby_starts_v101";
    private static final String LAST_SHOWN_AT = "last_shown_at";
    // Added in v102: conservative reservation at ad.show(), not merely callback.
    // The previous version recorded only onAdShowedFullScreenContent, leaving a gap
    // if Android dismissed/destroyed the host Activity before that callback.
    private static final String LAST_ATTEMPT_AT = "last_ad_show_attempt_at_v102";
    private static final long MIN_GAP_MS = 5L * 60L * 1000L;

    private InterstitialCadence() {}

    static synchronized boolean recordAndShouldShow(Context context, Uri uri) {
        if (uri == null || !"show-interstitial".equals(uri.getHost())) return false;

        final String event = uri.getQueryParameter("ad_event");
        if (event == null) return false; // Analytics events are NOT ad requests.

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean eligible = false;

        if ("legacy_bridge".equals(event)) {
            // WebView versions without typed ad events already enforced a
            // three-start threshold; apply only the native cooldown here.
            eligible = true;
        } else if ("non_x01_start".equals(event)) {
            // Arm the next boundary; NEVER show an ad on Start.
            recordNonX01Start(context);
            return false;
        } else if ("non_x01_boundary".equals(event)) {
            // The count was accumulated only at explicit Start from lobby.
            // Repeat and either Back button do not increment it.
            eligible = prefs.getInt(OTHER_GAME_COUNT, 0) >= 3;
        } else if ("legacy".equals(event)) {
            // Compatibility with old non-X01 event sources:
            // this legacy path still counts starts and is kept as-is.
            int count = prefs.getInt(OTHER_GAME_COUNT, 0) + 1;
            prefs.edit().putInt(OTHER_GAME_COUNT, count).apply();
            eligible = count >= 3;
        } else if ("completed".equals(event) || "abandoned".equals(event)) {
            if (!"classic".equals(uri.getQueryParameter("mode"))) return false;

            final int score = intParam(uri, "score");
            final int legs = intParam(uri, "legs");
            final int sets = intParam(uri, "sets");
            final boolean shortMatch = (score == 101 || score == 301)
                    && legs <= 1 && sets <= 1 && legs >= 0 && sets >= 0;

            if (shortMatch) {
                int count = prefs.getInt(SHORT_GAME_COUNT, 0) + 1;
                prefs.edit().putInt(SHORT_GAME_COUNT, count).apply();
                eligible = count >= 3;
            } else {
                // Abandon/repeat counts only for one-leg 101 and 301.
                eligible = "completed".equals(event)
                        && (score == 101 || score == 301
                            || score == 501 || score == 701 || score == 901);
            }
        } else {
            return false;
        }

        if (!eligible) return false;

        return cooldownExpired(prefs, System.currentTimeMillis());
    }

    private static boolean cooldownExpired(SharedPreferences prefs, long now) {
        final long lastShown = prefs.getLong(LAST_SHOWN_AT, 0L);
        final long lastAttempt = prefs.getLong(LAST_ATTEMPT_AT, 0L);
        final long last = Math.max(lastShown, lastAttempt);
        return last <= 0L || (now >= last && now - last >= MIN_GAP_MS);
    }

    // The definitive gate. Every real SDK fullscreen presentation passes
    // through here even if some Activity missed the earlier eligibility check.
    // Only reserve if a loaded interstitial exists and is about to be shown.
    static synchronized long claimBeforeAdShow(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        final long now = System.currentTimeMillis();
        if (!cooldownExpired(prefs, now)) return 0L;
        prefs.edit().putLong(LAST_ATTEMPT_AT, now).commit();
        return now;
    }

    // A genuine SDK onAdFailedToShow is not a display; undo its reservation.
    static synchronized void releaseFailedShow(Context context, long claimedAt) {
        if (claimedAt <= 0L) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (prefs.getLong(LAST_ATTEMPT_AT, 0L) == claimedAt) {
            prefs.edit().remove(LAST_ATTEMPT_AT).commit();
        }
    }

    /** Count an explicit non-X01 lobby Start, without opening any ad. */
    static synchronized void recordNonX01Start(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int count = prefs.getInt(OTHER_GAME_COUNT, 0);
        // Saturate at three. A failed fill or active cooldown never loses eligibility.
        prefs.edit().putInt(OTHER_GAME_COUNT, Math.min(3, count + 1)).apply();
    }

    /** Inspect eligibility without incrementing the counter or touching the cooldown. */
    static synchronized boolean shouldShowNonX01Boundary(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (prefs.getInt(OTHER_GAME_COUNT, 0) < 3) return false;
        return cooldownExpired(prefs, System.currentTimeMillis());
    }

    /** Timestamp of the last interstitial that actually opened, for safe review prompts. */
    static synchronized long lastShownAt(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getLong(LAST_SHOWN_AT, 0L);
    }

    /** Called ONLY from onAdShowedFullScreenContent, never from load or show attempts. */
    static synchronized void markShown(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putLong(LAST_SHOWN_AT, System.currentTimeMillis())
                .putInt(SHORT_GAME_COUNT, 0)
                .putInt(OTHER_GAME_COUNT, 0)
                .commit();
    }

    private static int intParam(Uri uri, String key) {
        try {
            return Integer.parseInt(uri.getQueryParameter(key));
        } catch (Exception ignored) {
            return -1;
        }
    }
}
