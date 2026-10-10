package com.randis2288.dartscorepro;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;

/**
 * Native source of truth for interstitial pacing.
 * The request is only counted when a game has ended or a qualified short game was left.
 * The cooldown and counters survive app restarts and reset only after an ad actually opens.
 */
final class InterstitialCadence {
    private static final String PREFS = "dartscore_interstitial_v2";
    private static final String SHORT_GAME_COUNT = "short_game_count";
    private static final String OTHER_GAME_COUNT = "other_game_count";
    private static final String LAST_SHOWN_AT = "last_shown_at";
    private static final long MIN_GAP_MS = 5L * 60L * 1000L;

    private InterstitialCadence() {}

    static synchronized boolean recordAndShouldShow(Context context, Uri uri) {
        if (uri == null || !"show-interstitial".equals(uri.getHost())) return false;

        final String event = uri.getQueryParameter("ad_event");
        if (event == null) return false; // Analytics events are NOT ad requests.

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean eligible = false;

        if ("legacy".equals(event)) {
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

        long now = System.currentTimeMillis();
        long last = prefs.getLong(LAST_SHOWN_AT, 0L);
        return last <= 0L || now < last || now - last >= MIN_GAP_MS;
    }

    /** Called ONLY from onAdShowedFullScreenContent, never from load or show attempts. */
    static synchronized void markShown(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putLong(LAST_SHOWN_AT, System.currentTimeMillis())
                .putInt(SHORT_GAME_COUNT, 0)
                .putInt(OTHER_GAME_COUNT, 0)
                .apply();
    }

    private static int intParam(Uri uri, String key) {
        try {
            return Integer.parseInt(uri.getQueryParameter(key));
        } catch (Exception ignored) {
            return -1;
        }
    }
}
