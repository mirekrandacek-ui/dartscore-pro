package com.randis2288.dartscorepro;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

/**
 * Lightweight launcher that resolves the current UMP consent state before the
 * WebView activity creates or requests AdMob ads.
 */
public class ConsentLauncherActivity extends Activity {
    private ConsentInformation consentInformation;
    private boolean mainLaunched = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        consentInformation = UserMessagingPlatform.getConsentInformation(this);

        ConsentRequestParameters params =
            new ConsentRequestParameters.Builder().build();

        consentInformation.requestConsentInfoUpdate(
            this,
            params,
            () -> {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                    this,
                    formError -> {
                        if (formError != null) {
                            Toast.makeText(
                                this,
                                "Privacy settings could not be loaded.",
                                Toast.LENGTH_SHORT
                            ).show();
                        }
                        launchMainApp();
                    }
                );
            },
            requestConsentError -> {
                // Do not lock the scorer behind a temporary network/UMP error.
                // A fresh consent status request is made again on the next app launch.
                launchMainApp();
            }
        );
    }

    private void launchMainApp() {
        if (mainLaunched || isFinishing()) return;
        mainLaunched = true;

        Intent intent = new Intent(this, MainWebViewActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}
