package com.randis2288.dartscorepro;

import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

/**
 * Launcher wrapper that enables edge-to-edge consistently and keeps the WebView/ad content
 * clear of system bars and display cutouts on Android 15+ as well as older supported versions.
 */
public class EdgeToEdgeMainActivity extends MainWebViewActivity {
    @Override
    public void setContentView(View view) {
        WindowCompat.enableEdgeToEdge(getWindow());

        ViewCompat.setOnApplyWindowInsetsListener(view, (v, insets) -> {
            Insets safeInsets = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );

            v.setPadding(
                safeInsets.left,
                safeInsets.top,
                safeInsets.right,
                safeInsets.bottom
            );

            return insets;
        });

        super.setContentView(view);
        ViewCompat.requestApplyInsets(view);
    }
}
