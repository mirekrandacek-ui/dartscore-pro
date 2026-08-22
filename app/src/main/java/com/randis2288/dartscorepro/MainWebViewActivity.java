package com.randis2288.dartscorepro;

import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.view.Gravity;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;

import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

public class MainWebViewActivity extends Activity implements PurchasesUpdatedListener {
    private static final String START_URL = "https://dartscore-pro.vercel.app/";
    private static final String PREMIUM_PRODUCT_ID = "premium_unlock";

    private static final String PROD_BANNER_ID = "ca-app-pub-9232105399279318/2746750399";
    private static final String TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";

    private static final int IN_APP_UPDATE_REQUEST_CODE = 610;

    // Od v12 už testujeme skutečné Premium chování.
    private static final boolean FORCE_FREE_BANNER_TEST = false;

    private WebView webView;
    private FrameLayout root;
    private FrameLayout adHost;
    private AdView adView;
    private boolean bannerLoaded = false;

    private TextToSpeech textToSpeech;
    private boolean ttsReady = false;
    private String pendingSpeechText;
    private String pendingSpeechLang;
    private String activeSpeechLanguageTag;

    private BillingClient billingClient;
    private boolean billingConnecting = false;
    private final List<Runnable> pendingBillingActions = new ArrayList<>();
    private ProductDetails premiumProductDetails;

    private AppUpdateManager appUpdateManager;
    private InstallStateUpdatedListener updateInstallListener;
    private boolean updateFlowStarted = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        root = new FrameLayout(this);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.TRANSPARENT);

        adHost = new FrameLayout(this);
        adHost.setBackgroundColor(Color.TRANSPARENT);
        adHost.setVisibility(View.GONE);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new DartScoreBridge(), "DartScoreAndroid");

        initTextToSpeech();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectWebFixes(view);
                view.postDelayed(() -> injectWebFixes(view), 1000);
                view.postDelayed(() -> injectWebFixes(view), 3000);
            }
        });

        root.addView(
            webView,
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        );

        root.addView(
            adHost,
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP
            )
        );
        adHost.bringToFront();

        setContentView(root);

        initInAppUpdate();
        initBilling();
        setPremiumState(false);
        webView.loadUrl(START_URL);
    }

    private void injectWebFixes(WebView view) {
        view.evaluateJavascript(
            "(function(){try{" +
            "var all=[].slice.call(document.querySelectorAll('body *'));" +
            "all.forEach(function(e){" +
            "var s=getComputedStyle(e);" +
            "var r=e.getBoundingClientRect();" +
            "var bottom=parseFloat(s.bottom)||0;" +
            "var h=r.height||0;" +
            "if((s.position==='fixed'||s.position==='sticky')&&r.top>window.innerHeight/2&&bottom<120&&h>20&&h<240){" +
            "if(!String(e.className).includes('toast')){" +
            "e.style.setProperty('display','none','important');" +
            "e.style.setProperty('height','0','important');" +
            "e.style.setProperty('min-height','0','important');" +
            "e.style.setProperty('padding','0','important');" +
            "e.style.setProperty('margin','0','important');" +
            "}" +
            "}" +
            "});" +
            "document.documentElement.style.setProperty('--sab','0px');" +
            "document.body.style.setProperty('padding-bottom','0','important');" +
            "var css='.toast{bottom:90px!important;}';" +
            "var st=document.getElementById('native-admob-toast-offset');" +
            "if(!st){st=document.createElement('style');st.id='native-admob-toast-offset';st.textContent=css;document.head.appendChild(st);}" +
            "if(!window.__dspNativeBillingHook){" +
            "window.__dspNativeBillingHook=true;" +
            "document.addEventListener('click',function(ev){" +
            "var b=ev.target&&ev.target.closest?ev.target.closest('button'):null;" +
            "if(!b||!window.DartScoreAndroid)return;" +
            "var txt=(b.innerText||b.textContent||'').toLowerCase();" +
            "var isRestore=txt.indexOf('obnov')>=0||txt.indexOf('restore')>=0;" +
            "var isBuy=txt.indexOf('aktivuj')>=0||txt.indexOf('activate')>=0||txt.indexOf('odemknout')>=0||txt.indexOf('unlock')>=0||txt.indexOf('koupit')>=0||txt.indexOf('buy')>=0||txt.indexOf('freischalten')>=0||txt.indexOf('activar')>=0||txt.indexOf('activeren')>=0||txt.indexOf('актив')>=0||txt.indexOf('解锁')>=0||txt.indexOf('激活')>=0;" +
            "if(isRestore||isBuy){" +
            "ev.preventDefault();ev.stopImmediatePropagation();" +
            "if(isRestore){window.DartScoreAndroid.restorePremium();}" +
            "else{window.DartScoreAndroid.buyPremium();}" +
            "}" +
            "},true);" +
            "}" +
            "}catch(e){}})();",
            null
        );
    }

    private boolean handleUrl(Uri uri) {
        if (uri == null) return false;

        String scheme = uri.getScheme();
        String host = uri.getHost();

        if ("dartscorepro".equals(scheme)) {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        }

        if ("https".equals(scheme) && "dartscore-pro.vercel.app".equals(host)) {
            return false;
        }

        if ("http".equals(scheme) || "https".equals(scheme)) {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        }

        return false;
    }

    private void setPremiumState(boolean isPremium) {
        if (!FORCE_FREE_BANNER_TEST && isPremium) {
            adHost.setVisibility(View.GONE);
            return;
        }

        adHost.setVisibility(View.VISIBLE);

        if (!bannerLoaded) {
            bannerLoaded = true;
            adHost.post(this::loadBanner);
        }
    }

    private void loadBanner() {
        int widthPx = getResources().getDisplayMetrics().widthPixels;
        float density = getResources().getDisplayMetrics().density;
        int adWidthDp = Math.max(320, (int) (widthPx / density));

        AdSize adSize = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(
            this,
            adWidthDp
        );

        int adHeightPx = adSize.getHeightInPixels(this);

        adHost.setLayoutParams(
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                adHeightPx,
                Gravity.TOP
            )
        );

        adView = new AdView(this);
        adView.setAdSize(adSize);

        boolean isDebug =
            (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        adView.setAdUnitId(isDebug ? TEST_BANNER_ID : PROD_BANNER_ID);

        adHost.removeAllViews();
        adHost.addView(
            adView,
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                adHeightPx,
                Gravity.TOP
            )
        );

        adView.loadAd(new AdRequest.Builder().build());
    }


    private void initInAppUpdate() {
        appUpdateManager = AppUpdateManagerFactory.create(this);

        updateInstallListener = state -> {
            if (state.installStatus() == InstallStatus.DOWNLOADED) {
                completeFlexibleUpdate();
            }
        };

        appUpdateManager.registerListener(updateInstallListener);
        checkForAppUpdate();
    }

    private void checkForAppUpdate() {
        if (appUpdateManager == null) return;

        appUpdateManager.getAppUpdateInfo()
            .addOnSuccessListener(appUpdateInfo -> {
                if (appUpdateInfo.installStatus() == InstallStatus.DOWNLOADED) {
                    completeFlexibleUpdate();
                    return;
                }

                if (updateFlowStarted) return;

                if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                    && appUpdateInfo.isUpdateTypeAllowed(
                        AppUpdateOptions.defaultOptions(AppUpdateType.FLEXIBLE)
                    )) {
                    startFlexibleUpdate(appUpdateInfo);
                }
            });
    }

    private void startFlexibleUpdate(AppUpdateInfo appUpdateInfo) {
        try {
            updateFlowStarted = true;

            appUpdateManager.startUpdateFlowForResult(
                appUpdateInfo,
                this,
                AppUpdateOptions.defaultOptions(AppUpdateType.FLEXIBLE),
                IN_APP_UPDATE_REQUEST_CODE
            );
        } catch (IntentSender.SendIntentException e) {
            updateFlowStarted = false;
            nativeToast("Aktualizaci nejde spustit.");
        }
    }

    private void completeFlexibleUpdate() {
        if (appUpdateManager == null) return;

        nativeToast("Aktualizace je stažená. Dokončuji instalaci…");

        if (root != null) {
            root.postDelayed(() -> appUpdateManager.completeUpdate(), 1200);
        } else {
            appUpdateManager.completeUpdate();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        checkForAppUpdate();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == IN_APP_UPDATE_REQUEST_CODE) {
            updateFlowStarted = false;
        }
    }

    private void initBilling() {
        billingClient = BillingClient.newBuilder(this)
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build()
            )
            .enableAutoServiceReconnection()
            .build();

        runWhenBillingReady(() -> {
            queryPremiumDetails(null);
            restorePremiumInternal(false);
        });
    }

    private void runWhenBillingReady(Runnable action) {
        if (billingClient == null) return;

        if (billingClient.isReady()) {
            action.run();
            return;
        }

        pendingBillingActions.add(action);

        if (billingConnecting) return;
        billingConnecting = true;

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                billingConnecting = false;

                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    nativeToast("Billing není dostupný: " + billingResult.getDebugMessage());
                    pendingBillingActions.clear();
                    return;
                }

                List<Runnable> actions = new ArrayList<>(pendingBillingActions);
                pendingBillingActions.clear();

                for (Runnable pendingAction : actions) {
                    pendingAction.run();
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                billingConnecting = false;
            }
        });
    }

    private void queryPremiumDetails(Runnable afterLoaded) {
        QueryProductDetailsParams.Product product =
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PREMIUM_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.INAPP)
                .build();

        QueryProductDetailsParams params =
            QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();

        billingClient.queryProductDetailsAsync(
            params,
            new ProductDetailsResponseListener() {
                @Override
                public void onProductDetailsResponse(
                    BillingResult billingResult,
                    QueryProductDetailsResult queryProductDetailsResult
                ) {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                        && queryProductDetailsResult != null
                        && !queryProductDetailsResult.getProductDetailsList().isEmpty()) {

                        premiumProductDetails =
                            queryProductDetailsResult.getProductDetailsList().get(0);

                        if (afterLoaded != null) afterLoaded.run();
                        return;
                    }

                    nativeToast("Premium produkt není dostupný: " + billingResult.getDebugMessage());
                }
            }
        );
    }

    private void launchPremiumPurchase() {
        runWhenBillingReady(() -> checkAlreadyOwned(() -> {
            Runnable startFlow = () -> {
                if (premiumProductDetails == null) {
                    nativeToast("Premium produkt není načtený.");
                    return;
                }

                BillingFlowParams.ProductDetailsParams.Builder detailBuilder =
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(premiumProductDetails);

                List<ProductDetails.OneTimePurchaseOfferDetails> offers =
                    premiumProductDetails.getOneTimePurchaseOfferDetailsList();

                if (offers != null && !offers.isEmpty()) {
                    String offerToken = offers.get(0).getOfferToken();
                    if (offerToken != null && !offerToken.isEmpty()) {
                        detailBuilder.setOfferToken(offerToken);
                    }
                }

                BillingFlowParams flowParams =
                    BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(
                            Collections.singletonList(detailBuilder.build())
                        )
                        .build();

                BillingResult result =
                    billingClient.launchBillingFlow(MainWebViewActivity.this, flowParams);

                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    nativeToast("Nákup nejde spustit: " + result.getDebugMessage());
                }
            };

            if (premiumProductDetails == null) {
                queryPremiumDetails(startFlow);
            } else {
                startFlow.run();
            }
        }));
    }

    private void checkAlreadyOwned(Runnable ifNotOwned) {
        QueryPurchasesParams params =
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();

        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                && purchases != null) {
                for (Purchase purchase : purchases) {
                    if (purchase.getProducts().contains(PREMIUM_PRODUCT_ID)
                        && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                        handlePremiumPurchase(purchase, "Premium už vlastníš");
                        return;
                    }
                }
            }

            ifNotOwned.run();
        });
    }

    private void restorePremiumInternal(boolean showMessageIfMissing) {
        runWhenBillingReady(() -> {
            QueryPurchasesParams params =
                QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build();

            billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                    && purchases != null) {
                    for (Purchase purchase : purchases) {
                        if (purchase.getProducts().contains(PREMIUM_PRODUCT_ID)
                            && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            handlePremiumPurchase(purchase, "Premium obnoveno");
                            return;
                        }
                    }
                }

                if (showMessageIfMissing) {
                    nativeToast("Premium nákup nebyl nalezen.");
                }
            });
        });
    }

    private void handlePremiumPurchase(Purchase purchase, String message) {
        if (!purchase.getProducts().contains(PREMIUM_PRODUCT_ID)) return;

        if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            nativeToast("Nákup čeká na dokončení.");
            return;
        }

        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
            nativeToast("Nákup není dokončený.");
            return;
        }

        if (!purchase.isAcknowledged()) {
            AcknowledgePurchaseParams acknowledgeParams =
                AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.getPurchaseToken())
                    .build();

            billingClient.acknowledgePurchase(acknowledgeParams, billingResult -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    grantPremium(message);
                } else {
                    nativeToast("Premium koupeno, ale potvrzení selhalo: "
                        + billingResult.getDebugMessage());
                }
            });
            return;
        }

        grantPremium(message);
    }

    private void grantPremium(String message) {
        runOnUiThread(() -> {
            setPremiumState(true);
            nativeToast(message);

            if (webView != null) {
                webView.evaluateJavascript(
                    "try{localStorage.setItem('premium','true');location.reload();}catch(e){}",
                    null
                );
            }
        });
    }

    private void nativeToast(String message) {
        runOnUiThread(() ->
            Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        );
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
            && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePremiumPurchase(purchase, "Premium aktivováno");
            }
            return;
        }

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            nativeToast("Nákup byl zrušen.");
            return;
        }

        nativeToast("Nákup selhal: " + billingResult.getDebugMessage());
    }


    private void initTextToSpeech() {
        ttsReady = false;

        textToSpeech = new TextToSpeech(this, status -> {
            runOnUiThread(() -> {
                ttsReady = status == TextToSpeech.SUCCESS;

                if (ttsReady && pendingSpeechText != null) {
                    String text = pendingSpeechText;
                    String lang = pendingSpeechLang;

                    pendingSpeechText = null;
                    pendingSpeechLang = null;

                    speakNative(text, lang);
                }
            });
        });
    }

    private void restartTextToSpeech(String text, String lang) {
        pendingSpeechText = text;
        pendingSpeechLang = lang;
        ttsReady = false;
        activeSpeechLanguageTag = null;

        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
            textToSpeech = null;
        }

        initTextToSpeech();
    }

    private String languageTagForSpeech(String lang) {
        if (lang == null) return "cs-CZ";

        switch (lang.trim()) {
            case "cs":
                return "cs-CZ";
            case "en":
                return "en-US";
            case "de":
                return "de-DE";
            case "es":
                return "es-ES";
            case "nl":
                return "nl-NL";
            case "ru":
                return "ru-RU";
            case "zh":
                return "zh-CN";
            default:
                return "cs-CZ";
        }
    }

    private Locale localeForSpeech(String lang) {
        return Locale.forLanguageTag(languageTagForSpeech(lang));
    }

    private Voice chooseVoiceForLocale(Locale locale) {
        if (textToSpeech == null || locale == null || textToSpeech.getVoices() == null) {
            return null;
        }

        String requestedTag = locale.toLanguageTag();
        String requestedLanguage = locale.getLanguage();
        Voice sameLanguageVoice = null;

        for (Voice voice : textToSpeech.getVoices()) {
            if (voice == null || voice.getLocale() == null) continue;

            Locale voiceLocale = voice.getLocale();
            String voiceTag = voiceLocale.toLanguageTag();

            if (requestedTag.equalsIgnoreCase(voiceTag)) {
                return voice;
            }

            if (sameLanguageVoice == null && requestedLanguage.equalsIgnoreCase(voiceLocale.getLanguage())) {
                sameLanguageVoice = voice;
            }
        }

        return sameLanguageVoice;
    }

    private void speakNative(String text, String lang) {
        if (text == null || text.trim().isEmpty()) return;

        if (!ttsReady || textToSpeech == null) {
            pendingSpeechText = text;
            pendingSpeechLang = lang;
            return;
        }

        String requestedLanguageTag = languageTagForSpeech(lang);

        if (activeSpeechLanguageTag != null
            && !activeSpeechLanguageTag.equalsIgnoreCase(requestedLanguageTag)) {
            restartTextToSpeech(text, lang);
            return;
        }

        Locale locale = Locale.forLanguageTag(requestedLanguageTag);

        textToSpeech.stop();

        int result = textToSpeech.setLanguage(locale);

        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            textToSpeech.setLanguage(Locale.getDefault());
        } else {
            Voice voice = chooseVoiceForLocale(locale);
            if (voice != null) {
                int voiceResult = textToSpeech.setVoice(voice);
                if (voiceResult == TextToSpeech.ERROR) {
                    textToSpeech.setLanguage(locale);
                }
            }
        }

        activeSpeechLanguageTag = requestedLanguageTag;

        textToSpeech.speak(
            text,
            TextToSpeech.QUEUE_FLUSH,
            null,
            "dartscore-pro-" + System.currentTimeMillis()
        );
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (appUpdateManager != null && updateInstallListener != null) {
            appUpdateManager.unregisterListener(updateInstallListener);
        }

        if (adView != null) {
            adView.destroy();
        }

        if (billingClient != null && billingClient.isReady()) {
            billingClient.endConnection();
        }

        pendingSpeechText = null;
        pendingSpeechLang = null;
        activeSpeechLanguageTag = null;

        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }

        super.onDestroy();
    }

    private class DartScoreBridge {
        @JavascriptInterface
        public void setPremium(boolean isPremium) {
            runOnUiThread(() -> setPremiumState(isPremium));
        }

        @JavascriptInterface
        public void buyPremium() {
            runOnUiThread(MainWebViewActivity.this::launchPremiumPurchase);
        }

        @JavascriptInterface
        public void restorePremium() {
            runOnUiThread(() -> restorePremiumInternal(true));
        }
    }
}
