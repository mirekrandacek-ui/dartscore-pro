package com.randis2288.dartscorepro;

import android.app.Activity;
import android.os.Bundle;
import android.widget.FrameLayout;
import android.widget.Toast;

import com.google.android.ump.UserMessagingPlatform;

/**
 * Opens the UMP privacy options form (also reachable from system app settings).
 * Firebase collection is blocked while the form is open and the result is applied afterwards.
 */
public class DiagnosticsActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(new FrameLayout(this));

        UnifiedConsent.block(this);
        UserMessagingPlatform.showPrivacyOptionsForm(this, formError -> {
            UnifiedConsent.arm(this);
            if (formError != null) {
                Toast.makeText(this, "Privacy options are not available here.", Toast.LENGTH_SHORT).show();
            }
            finish();
        });
    }
}
