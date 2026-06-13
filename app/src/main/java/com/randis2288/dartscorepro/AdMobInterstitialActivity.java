package com.randis2288.dartscorepro;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

public class AdMobInterstitialActivity extends Activity {
    private static final String TAG = "DartScoreAdMob";
    private static final String AD_UNIT_ID = "ca-app-pub-9232105399279318/3900554547";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean finished = false;

    private final Runnable timeoutRunnable = new Runnable() {
        @Override
        public void run() {
            Log.w(TAG, "Interstitial load timeout.");
            finishSafely();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        overridePendingTransition(0, 0);
        handler.postDelayed(timeoutRunnable, 7000);
        loadInterstitial();
    }

    private void loadInterstitial() {
        AdRequest adRequest = new AdRequest.Builder().build();

        InterstitialAd.load(
            this,
            AD_UNIT_ID,
            adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull InterstitialAd interstitialAd) {
                    handler.removeCallbacks(timeoutRunnable);
                    showInterstitial(interstitialAd);
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    Log.w(TAG, "Interstitial failed to load: " + loadAdError);
                    finishSafely();
                }
            }
        );
    }

    private void showInterstitial(InterstitialAd interstitialAd) {
        interstitialAd.setFullScreenContentCallback(
            new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    finishSafely();
                }

                @Override
                public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                    Log.w(TAG, "Interstitial failed to show: " + adError);
                    finishSafely();
                }
            }
        );

        if (!isFinishing() && !isDestroyed()) {
            interstitialAd.show(this);
        } else {
            finishSafely();
        }
    }

    private void finishSafely() {
        if (finished) return;
        finished = true;
        handler.removeCallbacks(timeoutRunnable);
        finish();
        overridePendingTransition(0, 0);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(timeoutRunnable);
        super.onDestroy();
    }
}
