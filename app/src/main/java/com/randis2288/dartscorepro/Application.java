package com.randis2288.dartscorepro;

import java.util.ArrayList;
import java.util.List;

import com.google.android.gms.ads.MobileAds;

/**
 * Application-level holder for one-time Mobile Ads SDK initialization.
 *
 * IMPORTANT: UMP consent is collected by MainWebViewActivity first.
 * Do not initialize or request ads from Application.onCreate().
 */
public class Application extends android.app.Application {
    private final Object adsInitLock = new Object();
    private final List<Runnable> pendingAdsReadyCallbacks = new ArrayList<>();
    private boolean mobileAdsInitializing = false;
    private boolean mobileAdsInitialized = false;

    @Override
    public void onCreate() {
        super.onCreate();
        // Intentionally no MobileAds.initialize() here.
        // UMP must update consent state before the first ad request.
    }

    public void initializeMobileAdsAfterConsent(Runnable onReady) {
        synchronized (adsInitLock) {
            if (mobileAdsInitialized) {
                if (onReady != null) {
                    onReady.run();
                }
                return;
            }

            if (onReady != null) {
                pendingAdsReadyCallbacks.add(onReady);
            }

            if (mobileAdsInitializing) {
                return;
            }

            mobileAdsInitializing = true;
        }

        MobileAds.initialize(
            this,
            initializationStatus -> {
                AdMobInterstitialManager.preload(this);

                List<Runnable> callbacks;
                synchronized (adsInitLock) {
                    mobileAdsInitializing = false;
                    mobileAdsInitialized = true;
                    callbacks = new ArrayList<>(pendingAdsReadyCallbacks);
                    pendingAdsReadyCallbacks.clear();
                }

                for (Runnable callback : callbacks) {
                    callback.run();
                }
            }
        );
    }
}
