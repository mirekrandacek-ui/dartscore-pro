package com.randis2288.dartscorepro;

import android.content.Context;
import android.content.res.AssetManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Serves the bundled web build under the production URL when the device has
 * no validated internet connection. Keeping the request URL on the production
 * origin preserves WebView localStorage, including Continue-game state.
 */
public final class OfflineWebViewClient extends WebViewClient {
    private static final String APP_HOST = "dartscore-pro.vercel.app";
    private static final String ASSET_PREFIX = "offline/";

    public interface UrlHandler {
        boolean handle(Uri uri);
    }

    public interface PageFinishedHandler {
        void handle(WebView view, String url);
    }

    private final Context context;
    private final AssetManager assets;
    private final UrlHandler urlHandler;
    private final PageFinishedHandler pageFinishedHandler;

    public OfflineWebViewClient(
        Context context,
        UrlHandler urlHandler,
        PageFinishedHandler pageFinishedHandler
    ) {
        this.context = context.getApplicationContext();
        this.assets = context.getAssets();
        this.urlHandler = urlHandler;
        this.pageFinishedHandler = pageFinishedHandler;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        return urlHandler.handle(request.getUrl());
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return urlHandler.handle(Uri.parse(url));
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(
        WebView view,
        WebResourceRequest request
    ) {
        return offlineResponse(request.getUrl());
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
        return offlineResponse(Uri.parse(url));
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        pageFinishedHandler.handle(view, url);
    }

    private WebResourceResponse offlineResponse(Uri uri) {
        if (uri == null || hasValidatedInternet()) return null;
        if (!"https".equalsIgnoreCase(uri.getScheme())) return null;
        if (!APP_HOST.equalsIgnoreCase(uri.getHost())) return null;

        String path = uri.getPath();
        if (path == null || path.isEmpty() || "/".equals(path)) {
            path = "index.html";
        } else if (path.startsWith("/")) {
            path = path.substring(1);
        }

        // SPA routes fall back to the bundled index document.
        String assetPath = ASSET_PREFIX + path;
        InputStream stream = openAsset(assetPath);
        if (stream == null && !hasFileExtension(path)) {
            assetPath = ASSET_PREFIX + "index.html";
            stream = openAsset(assetPath);
        }
        if (stream == null) return null;

        String mimeType = mimeTypeFor(assetPath);
        String encoding = isTextMime(mimeType) ? "UTF-8" : null;

        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "https://" + APP_HOST);
        headers.put("Cache-Control", "no-store");

        return new WebResourceResponse(
            mimeType,
            encoding,
            200,
            "OK",
            headers,
            stream
        );
    }

    private InputStream openAsset(String assetPath) {
        try {
            return assets.open(assetPath, AssetManager.ACCESS_STREAMING);
        } catch (IOException ignored) {
            return null;
        }
    }

    private boolean hasValidatedInternet() {
        ConnectivityManager manager =
            (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (manager == null) return false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network network = manager.getActiveNetwork();
            if (network == null) return false;
            NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
            return capabilities != null
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        }

        android.net.NetworkInfo info = manager.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }

    private boolean hasFileExtension(String path) {
        int slash = path.lastIndexOf('/');
        int dot = path.lastIndexOf('.');
        return dot > slash;
    }

    private String mimeTypeFor(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".js")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) return "application/json";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    private boolean isTextMime(String mimeType) {
        return mimeType.startsWith("text/")
            || "application/javascript".equals(mimeType)
            || "application/json".equals(mimeType)
            || "image/svg+xml".equals(mimeType);
    }
}
