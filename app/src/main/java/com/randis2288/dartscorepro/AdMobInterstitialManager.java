package com.randis2288.dartscorepro;

import android.app.Activity;
import android.content.Context;
import android.os.SystemClock;
import android.util.Log;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

public final class AdMobInterstitialManager {
    private static final String TAG = "DartScoreAdMob";
    private static final String AD_UNIT_ID =
        "ca-app-pub-9232105399279318/3900554547";

    private static final long MAX_AD_AGE_MS = 55L * 60L * 1000L;
    private static final long LOAD_RETRY_DELAY_MS = 5000L;

    private static InterstitialAd interstitialAd;
    private static boolean loading = false;
    private static long loadedAtMs = 0L;
    private static long lastLoadAttemptMs = 0L;

    private AdMobInterstitialManager() {
    }

    public static synchronized void preload(Context context) {
        long now = SystemClock.elapsedRealtime();

        if (interstitialAd != null &&
            now - loadedAtMs < MAX_AD_AGE_MS) {
            return;
        }

        if (interstitialAd != null) {
            interstitialAd = null;
            loadedAtMs = 0L;
        }

        if (loading || now - lastLoadAttemptMs < LOAD_RETRY_DELAY_MS) {
            return;
        }

        loading = true;
        lastLoadAttemptMs = now;

        AdRequest request = new AdRequest.Builder().build();

        InterstitialAd.load(
            context.getApplicationContext(),
            AD_UNIT_ID,
            request,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(
                    @NonNull InterstitialAd loadedAd
                ) {
                    synchronized (AdMobInterstitialManager.class) {
                        interstitialAd = loadedAd;
                        loadedAtMs = SystemClock.elapsedRealtime();
                        loading = false;
                    }

                    Log.d(TAG, "Interstitial preloaded.");
                }

                @Override
                public void onAdFailedToLoad(
                    @NonNull LoadAdError error
                ) {
                    synchronized (AdMobInterstitialManager.class) {
                        interstitialAd = null;
                        loadedAtMs = 0L;
                        loading = false;
                    }

                    Log.w(TAG, "Interstitial preload failed: " + error);
                }
            }
        );
    }

    public static synchronized boolean showIfReady(
        Activity activity,
        Runnable onFinished
    ) {
        long now = SystemClock.elapsedRealtime();

        if (interstitialAd == null ||
            now - loadedAtMs >= MAX_AD_AGE_MS) {
            interstitialAd = null;
            loadedAtMs = 0L;
            preload(activity.getApplicationContext());
            return false;
        }

        InterstitialAd adToShow = interstitialAd;
        interstitialAd = null;
        loadedAtMs = 0L;

        adToShow.setFullScreenContentCallback(
            new FullScreenContentCallback() {
                private void finishAndPreload() {
                    preload(activity.getApplicationContext());
                    onFinished.run();
                }

                @Override
                public void onAdDismissedFullScreenContent() {
                    finishAndPreload();
                }

                @Override
                public void onAdFailedToShowFullScreenContent(
                    @NonNull AdError error
                ) {
                    Log.w(TAG, "Interstitial failed to show: " + error);
                    finishAndPreload();
                }
            }
        );

        adToShow.show(activity);
        return true;
    }
}
