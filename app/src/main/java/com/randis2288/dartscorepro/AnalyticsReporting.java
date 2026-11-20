package com.randis2288.dartscorepro;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;

import com.google.firebase.analytics.FirebaseAnalytics;

import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Consent-gated Firebase Analytics. Collection is off until a consent choice allows it.
 * Ad-related consent signals stay denied here: ads are governed by the AdMob/UMP flow.
 */
final class AnalyticsReporting {

    private static final String PREFS = "privacy_choices_v1";
    private static final String KEY_ANALYTICS = "analytics";
    private static final String KEY_CHOSEN = "chosen";

    /** True only while Analytics collection is really on for the current consent choice. */
    private static boolean collectionActive = false;
    private static String lastScreenName;

    private static final Set<String> GAME_TYPES = set("classic", "cricket", "around", "roulette", "rouletteDouble");
    private static final Set<String> PLAYER_MODES = set("individual", "teams");
    private static final Set<String> RESUME_FLAGS = set("0", "1");
    private static final Set<String> ABANDON_REASONS = set("back", "restart", "new_game");
    private static final Set<String> SCREEN_NAMES = set("lobby", "game", "statistics", "privacy");

    private AnalyticsReporting() {
    }

    private static Set<String> set(String... values) {
        return Collections.unmodifiableSet(new HashSet<>(Arrays.asList(values)));
    }

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean isEnabled(Context context) {
        return prefs(context).getBoolean(KEY_ANALYTICS, false);
    }

    /** Hard stop: no collection until {@link #apply} allows it again. */
    static synchronized void disableCollection(Context context) {
        collectionActive = false;
        FirebaseAnalytics.getInstance(context.getApplicationContext()).setAnalyticsCollectionEnabled(false);
    }

    /**
     * Applies a consent choice to Analytics and Crashlytics together.
     * If persisting the Crashlytics choice fails, everything falls back to "off".
     */
    static synchronized void apply(Context context, boolean analytics, boolean crash) {
        final Context app = context.getApplicationContext();
        boolean changed = isEnabled(app) != analytics || CrashReporting.isEnabled(app) != crash;

        if (!changed) {
            publish(app, analytics);
            return;
        }

        disableCollection(app);

        boolean saved = prefs(app).edit()
            .putBoolean(KEY_ANALYTICS, analytics)
            .putBoolean(KEY_CHOSEN, true)
            .commit();
        if (!saved) {
            publish(app, isEnabled(app));
            return;
        }

        if (CrashReporting.update(app, crash, true)) {
            publish(app, analytics);
        } else {
            prefs(app).edit().putBoolean(KEY_ANALYTICS, false).commit();
            publish(app, false);
        }
    }

    private static void publish(Context app, boolean enabled) {
        FirebaseAnalytics analytics = FirebaseAnalytics.getInstance(app);

        Map<FirebaseAnalytics.ConsentType, FirebaseAnalytics.ConsentStatus> consent =
            new EnumMap<>(FirebaseAnalytics.ConsentType.class);
        consent.put(FirebaseAnalytics.ConsentType.ANALYTICS_STORAGE,
            enabled ? FirebaseAnalytics.ConsentStatus.GRANTED : FirebaseAnalytics.ConsentStatus.DENIED);
        consent.put(FirebaseAnalytics.ConsentType.AD_STORAGE, FirebaseAnalytics.ConsentStatus.DENIED);
        consent.put(FirebaseAnalytics.ConsentType.AD_USER_DATA, FirebaseAnalytics.ConsentStatus.DENIED);
        consent.put(FirebaseAnalytics.ConsentType.AD_PERSONALIZATION, FirebaseAnalytics.ConsentStatus.DENIED);
        analytics.setConsent(consent);

        if (!enabled) {
            analytics.resetAnalyticsData();
        }
        analytics.setAnalyticsCollectionEnabled(enabled);
        collectionActive = enabled;
    }

    /**
     * Logs one game or screen event coming from the web layer
     * (dartscorepro://analytics?analytics_event=...). Only a fixed list of events and
     * values is accepted, and nothing is logged unless consent allows Analytics.
     * No player names or other free text can ever reach Firebase through this path.
     */
    static synchronized void logFromUri(Context context, Uri uri) {
        if (!collectionActive || uri == null || uri.toString().length() > 512
                || !isEnabled(context.getApplicationContext())) {
            return;
        }

        String event = uri.getQueryParameter("analytics_event");
        if (event == null) {
            return;
        }

        Map<String, String> params = new HashMap<>();
        for (String name : uri.getQueryParameterNames()) {
            if (uri.getQueryParameters(name).size() != 1) {
                return;
            }
            if (!"analytics_event".equals(name)) {
                String value = uri.getQueryParameter(name);
                if (value == null) {
                    return;
                }
                params.put(name, value);
            }
        }

        if (!isAllowed(event, params)) {
            return;
        }

        if ("screen_view".equals(event)) {
            if (params.get("screen_name").equals(lastScreenName)) {
                return;
            }
            lastScreenName = params.get("screen_name");
        }

        Bundle bundle = new Bundle();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if ("is_resume".equals(entry.getKey())) {
                bundle.putLong(entry.getKey(), Long.parseLong(entry.getValue()));
            } else {
                bundle.putString(entry.getKey(), entry.getValue());
            }
        }
        FirebaseAnalytics.getInstance(context.getApplicationContext()).logEvent(event, bundle);
    }

    /** Exact parameter names and allowed values for each event. */
    static boolean isAllowed(String event, Map<String, String> params) {
        Set<String> keys;
        switch (event) {
            case "game_started":
                keys = set("game_type", "player_mode", "is_resume");
                break;
            case "game_completed":
                keys = set("game_type", "player_mode");
                break;
            case "game_abandoned":
                keys = set("game_type", "abandon_reason");
                break;
            case "screen_view":
                keys = set("screen_name", "screen_class");
                break;
            default:
                return false;
        }
        if (!params.keySet().equals(keys)) {
            return false;
        }

        if ("screen_view".equals(event)) {
            return SCREEN_NAMES.contains(params.get("screen_name"))
                && "DartScore".equals(params.get("screen_class"));
        }

        return GAME_TYPES.contains(params.get("game_type"))
            && (!params.containsKey("player_mode") || PLAYER_MODES.contains(params.get("player_mode")))
            && (!params.containsKey("is_resume") || RESUME_FLAGS.contains(params.get("is_resume")))
            && (!params.containsKey("abandon_reason") || ABANDON_REASONS.contains(params.get("abandon_reason")));
    }
}
