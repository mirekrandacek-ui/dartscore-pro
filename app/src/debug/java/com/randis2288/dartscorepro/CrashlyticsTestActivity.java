package com.randis2288.dartscorepro;

import android.app.Activity;
import android.os.Bundle;

/** Debug-only: launch with adb to verify Crashlytics delivery. Not part of release builds. */
public class CrashlyticsTestActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        throw new IllegalStateException("Crashlytics 2.10 debug verification 20261120");
    }
}
