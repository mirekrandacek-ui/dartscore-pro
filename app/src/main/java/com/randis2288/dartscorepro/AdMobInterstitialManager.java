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
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.UserMessagingPlatform;

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

    private static boolean canRequestAds(Context context) {
        ConsentInformation consentInformation =
            UserMessagingPlatform.getConsentInformation(context.getApplicationContext());
        return consentInformation.canRequestAds();
    }

    public static synchronized void preload(Context context) {
        if (!canRequestAds(context)) {
            Log.d(TAG, "Interstitial preload skipped until UMP allows ad requests.");
            return;
        }

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
        Runnable onFinished,
        Runnable onShown
    ) {
        if (!canRequestAds(activity)) {
            Log.d(TAG, "Interstitial show skipped until UMP allows ad requests.");
            return false;
        }

        long now = SystemClock.elapsedRealtime();

        if (interstitialAd == null ||
            now - loadedAtMs >= MAX_AD_AGE_MS) {
            interstitialAd = null;
            loadedAtMs = 0L;
            preload(activity.getApplicationContext());
            return false;
        }

        // Mandatory shared SDK-level cooldown gate. The Activity-level check
        // is only an optimization; it is not sufficient on some Android builds
        // if a fullscreen callback was missed during lifecycle transitions.
        final long claimAt = InterstitialCadence.claimBeforeAdShow(
            activity.getApplicationContext()
        );
        if (claimAt == 0L) {
            Log.i(TAG, "Interstitial suppressed by global 5-minute cooldown.");
            return false;
        }

        InterstitialAd adToShow = interstitialAd;
        interstitialAd = null;
        loadedAtMs = 0L;

        adToShow.setFullScreenContentCallback(
            new FullScreenContentCallback() {
                private boolean confirmedShown = false;

                private void finishAndPreload() {
                    preload(activity.getApplicationContext());
                    onFinished.run();
                }

                private void markDisplayedOnce() {
                    if (confirmedShown) return;
                    confirmedShown = true;
                    // Persist the real time; the reservation already prevented
                    // any other interstitial opening during callback delivery.
                    onShown.run();
                }

                @Override
                public void onAdShowedFullScreenContent() {
                    markDisplayedOnce();
                }

                @Override
                public void onAdDismissedFullScreenContent() {
                    // Defensive: if an SDK callback is missed but the user
                    // dismissed the ad, it was shown. Retain the cooldown.
                    markDisplayedOnce();
                    finishAndPreload();
                }

                @Override
                public void onAdFailedToShowFullScreenContent(
                    @NonNull AdError error
                ) {
                    Log.w(TAG, "Interstitial failed to show: " + error);
                    if (!confirmedShown) {
                        InterstitialCadence.releaseFailedShow(
                            activity.getApplicationContext(), claimAt
                        );
                    }
                    finishAndPreload();
                }
            }
        );

        try {
            adToShow.show(activity);
            return true;
        } catch (RuntimeException e) {
            Log.e(TAG, "Interstitial show threw before SDK display.", e);
            InterstitialCadence.releaseFailedShow(activity.getApplicationContext(), claimAt);
            preload(activity.getApplicationContext());
            return false;
        }
    }
}
