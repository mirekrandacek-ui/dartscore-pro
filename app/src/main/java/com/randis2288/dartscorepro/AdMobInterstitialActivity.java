package com.randis2288.dartscorepro;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.google.firebase.analytics.FirebaseAnalytics;

public class AdMobInterstitialActivity extends Activity {
    private static final String TAG = "DartScoreAdMob";
    private static final long RETRY_INTERVAL_MS = 100L;
    private static final long SHOW_TIMEOUT_MS = 3000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean showing = false;
    private boolean finished = false;

    private final Runnable retryRunnable = new Runnable() {
        @Override
        public void run() {
            if (finished || showing) return;

            boolean shown = AdMobInterstitialManager.showIfReady(
                AdMobInterstitialActivity.this,
                AdMobInterstitialActivity.this::finishSafely
            );

            if (shown) {
                showing = true;
                handler.removeCallbacks(timeoutRunnable);
                return;
            }

            handler.postDelayed(this, RETRY_INTERVAL_MS);
        }
    };

    private final Runnable timeoutRunnable = () -> {
        Log.w(TAG, "Preloaded interstitial was not ready in time.");
        finishSafely();
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        overridePendingTransition(0, 0);

        if (handleAnalyticsIntent(getIntent() != null ? getIntent().getData() : null)) {
            finish();
            overridePendingTransition(0, 0);
            return;
        }

        AdMobInterstitialManager.preload(getApplicationContext());

        handler.post(retryRunnable);
        handler.postDelayed(timeoutRunnable, SHOW_TIMEOUT_MS);
    }

    private boolean handleAnalyticsIntent(Uri uri) {
        if (uri == null) return false;

        String eventName = uri.getQueryParameter("analytics_event");
        if (eventName == null || eventName.isEmpty()) return false;

        if (!eventName.matches("[A-Za-z][A-Za-z0-9_]{0,39}")) {
            Log.w(TAG, "Ignored invalid Analytics event name: " + eventName);
            return true;
        }

        Bundle params = new Bundle();
        for (String key : uri.getQueryParameterNames()) {
            if ("analytics_event".equals(key)) continue;
            if (!key.matches("[A-Za-z][A-Za-z0-9_]{0,39}")) continue;

            String value = uri.getQueryParameter(key);
            if (value == null) continue;

            try {
                params.putLong(key, Long.parseLong(value));
                continue;
            } catch (NumberFormatException ignored) { }

            try {
                params.putDouble(key, Double.parseDouble(value));
                continue;
            } catch (NumberFormatException ignored) { }

            params.putString(key, value.length() > 100 ? value.substring(0, 100) : value);
        }

        FirebaseAnalytics.getInstance(this).logEvent(eventName, params);
        Log.d(TAG, "Logged Analytics event: " + eventName);
        return true;
    }

    private void finishSafely() {
        if (finished) return;

        finished = true;
        handler.removeCallbacks(retryRunnable);
        handler.removeCallbacks(timeoutRunnable);

        finish();
        overridePendingTransition(0, 0);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(retryRunnable);
        handler.removeCallbacks(timeoutRunnable);
        super.onDestroy();
    }
}
