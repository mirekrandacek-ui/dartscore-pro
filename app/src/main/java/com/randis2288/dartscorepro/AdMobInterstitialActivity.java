package com.randis2288.dartscorepro;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

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

        AdMobInterstitialManager.preload(getApplicationContext());

        handler.post(retryRunnable);
        handler.postDelayed(timeoutRunnable, SHOW_TIMEOUT_MS);
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
