import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const manifest = file('app/src/main/AndroidManifest.xml');
const appGradle = file('app/build.gradle');
const topGradle = file('build.gradle');
const wrapper = file('gradle/wrapper/gradle-wrapper.properties');
const java = file('app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java');
const react = file('src/App.jsx');
const css = file('src/app.css');
const keepRules = file('app/src/main/keepRules/workmanager-room.keep');

test('Play warning 1: native game handles edge-to-edge and all safe window insets', () => {
  assert.match(java, /WindowCompat\.enableEdgeToEdge\(getWindow\(\)\)/);
  assert.match(java, /WindowInsetsCompat\.Type\.systemBars\(\)/);
  assert.match(java, /WindowInsetsCompat\.Type\.displayCutout\(\)/);
  assert.match(java, /WindowInsetsCompat\.Type\.mandatorySystemGestures\(\)/);
  for (const edge of ['left','top','right','bottom']) {
    assert.match(java, new RegExp(edge + 'SystemInsetPx'));
  }
  assert.match(java, /webParams\.topMargin = topSystemInsetPx/);
  assert.match(java, /hostParams\.bottomMargin = bottomSystemInsetPx/);
  assert.match(react, /root\.classList\.add\('native-android-insets'\)/);
  assert.match(css, /\.native-android-insets \.header\{padding-top:6px\}/);
});

test('Play warning 2: modern AndroidX system-bar API, no obsolete browser-helper fallback', () => {
  assert.match(appGradle, /androidbrowserhelper:2\.7\.4/);
  assert.match(appGradle, /androidx\.core:core:1\.17\.0/);
  assert.doesNotMatch(manifest, /com\.google\.androidbrowserhelper\.trusted\.WebViewFallbackActivity/);
  assert.doesNotMatch(java, /\.setNavigationBarColor\(|\.setStatusBarColor\(|\.getStatusBarColor\(/);
});

test('Play warning 3: orientation/resizing supports Android 16 tablets and foldables', () => {
  assert.doesNotMatch(manifest, /android:screenOrientation="portrait"/);
  assert.doesNotMatch(manifest, /android\.support\.customtabs\.trusted\.SCREEN_ORIENTATION/);
  assert.match(manifest, /android:resizeableActivity="true"/);
  assert.doesNotMatch(appGradle, /orientation: 'portrait'/);
});

test('Play warning 4: AGP9.3 R8 code and resource optimization with compatible Gradle', () => {
  assert.match(topGradle, /com\.android\.tools\.build:gradle:9\.3\.3/);
  assert.match(wrapper, /gradle-9\.5\.0-bin\.zip/);
  assert.match(appGradle, /optimization\s*\{\s*enable\s*=\s*true/);
  assert.match(appGradle, /resValues\s*=\s*true/);
  assert.doesNotMatch(appGradle, /lintOptions/);
  assert.match(appGradle, /targetSdkVersion 36/);
  assert.match(appGradle, /versionCode 104/);
  assert.ok(appGradle.includes('versionName "1.1.70"'));
  assert.ok(keepRules.includes('-keep class androidx.work.impl.WorkDatabase_Impl'));
  assert.ok(keepRules.includes('public <init>();'));
});
