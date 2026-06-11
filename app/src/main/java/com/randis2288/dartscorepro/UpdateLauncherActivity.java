package com.randis2288.dartscorepro;

import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;
import android.os.Bundle;
import android.util.Log;

import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.UpdateAvailability;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

public class UpdateLauncherActivity extends LauncherActivity {

    private static final String TAG = "DartScoreUpdate";
    private static final int UPDATE_REQUEST_CODE = 1001;

    private AppUpdateManager appUpdateManager;
    private boolean updateFlowStarted = false;
    private boolean twaLaunched = false;

    @Override
    protected boolean shouldLaunchImmediately() {
        // Nejdřív zkontrolujeme aktualizaci, teprve potom otevřeme TWA.
        return false;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        appUpdateManager = AppUpdateManagerFactory.create(this);
        checkForUpdate();
    }

    private void checkForUpdate() {
        appUpdateManager
            .getAppUpdateInfo()
            .addOnSuccessListener(appUpdateInfo -> {
                if (
                    appUpdateInfo.updateAvailability()
                        == UpdateAvailability.UPDATE_AVAILABLE
                    && appUpdateInfo.isUpdateTypeAllowed(
                        AppUpdateType.IMMEDIATE
                    )
                ) {
                    startImmediateUpdate(appUpdateInfo);
                } else {
                    launchTwaOnce();
                }
            })
            .addOnFailureListener(error -> {
                Log.w(TAG, "Kontrola aktualizace selhala.", error);
                launchTwaOnce();
            });
    }

    private void startImmediateUpdate(AppUpdateInfo appUpdateInfo) {
        try {
            updateFlowStarted = appUpdateManager.startUpdateFlowForResult(
                appUpdateInfo,
                this,
                AppUpdateOptions
                    .newBuilder(AppUpdateType.IMMEDIATE)
                    .build(),
                UPDATE_REQUEST_CODE
            );

            if (!updateFlowStarted) {
                launchTwaOnce();
            }
        } catch (IntentSender.SendIntentException error) {
            Log.e(TAG, "Aktualizaci se nepodařilo spustit.", error);
            launchTwaOnce();
        }
    }

    private void launchTwaOnce() {
        if (twaLaunched) return;

        twaLaunched = true;
        launchTwa();
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (appUpdateManager == null || twaLaunched) return;

        appUpdateManager
            .getAppUpdateInfo()
            .addOnSuccessListener(appUpdateInfo -> {
                if (
                    appUpdateInfo.updateAvailability()
                        == UpdateAvailability
                            .DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
                ) {
                    startImmediateUpdate(appUpdateInfo);
                }
            });
    }

    @Override
    protected void onActivityResult(
        int requestCode,
        int resultCode,
        Intent data
    ) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode != UPDATE_REQUEST_CODE) return;

        if (resultCode != Activity.RESULT_OK) {
            // Hráč aktualizaci zrušil nebo se nezdařila.
            // Aplikace se otevře a při příštím spuštění nabídku zopakuje.
            updateFlowStarted = false;
            launchTwaOnce();
        }
    }
}
