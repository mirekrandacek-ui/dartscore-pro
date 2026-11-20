package com.randis2288.dartscorepro;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;

import java.util.Locale;

/** Offline privacy policy with a shortcut to the privacy options (consent) form. */
public class PrivacyPolicyActivity extends Activity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        boolean czech = "cs".equals(Locale.getDefault().getLanguage());

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setFitsSystemWindows(true);

        Button back = new Button(this);
        back.setText(czech ? "Zpět" : "Back");
        back.setOnClickListener(view -> finish());
        layout.addView(back);

        Button options = new Button(this);
        options.setText(czech ? "Soukromí a diagnostika" : "Privacy and diagnostics");
        options.setOnClickListener(view -> startActivity(new Intent(this, DiagnosticsActivity.class)));
        layout.addView(options);

        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(false);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                openExternally(request.getUrl());
                return true;
            }
        });
        layout.addView(webView, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1.0f));
        setContentView(layout);

        webView.loadUrl("file:///android_asset/offline/privacy/android.html");
        AnalyticsReporting.logFromUri(this, Uri.parse(
            "dartscorepro://analytics?analytics_event=screen_view&screen_name=privacy&screen_class=DartScore"));
    }

    private void openExternally(Uri uri) {
        String scheme = uri.getScheme();
        if ("https".equals(scheme) || "http".equals(scheme) || "mailto".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) {
                // No app can open this link.
            }
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
