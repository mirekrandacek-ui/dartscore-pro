import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const pkg = 'com.randis2288.dartscorepro';
const adbBin = process.env.ADB_PATH || 'adb';
const adb = (...args) => execFileSync(adbBin, args, { encoding: 'utf8', timeout: 25000 }).trim();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const output = 'build/android-ad-resume-evidence';
mkdirSync(output, { recursive: true });
let ws;
let sequence = 0;
const callbacks = new Map();

try {
  const apk = process.env.DARTSCORE_APK || 'app/build/outputs/apk/debug/app-debug.apk';
  adb('install', '-r', apk);
  adb('shell', 'am', 'force-stop', pkg);
  // Always test a clean Free installation; do not reuse an emulator's Premium state.
  adb('shell', 'pm', 'clear', pkg);
  adb('logcat', '-c');
  adb('shell', 'am', 'start', '-n', pkg + '/.ConsentLauncherActivity');

  let socket;
  for (let attempt = 0; attempt < 60; attempt++) {
    let pid = '';
    try { pid = adb('shell', 'pidof', pkg); } catch {}
    const sockets = adb('shell', 'cat', '/proc/net/unix');
    socket = pid ? sockets.match(new RegExp('@(webview_devtools_remote_' + pid + ')(?:\\s|$)'))?.[1] : undefined;
    const foreground = adb('shell', 'dumpsys', 'activity', 'activities');
    if (socket && foreground.includes(pkg + '/.MainWebViewActivity')) break;
    socket = undefined;
    await delay(1500);
  }
  assert.ok(socket, 'actual native Android WebView must appear');
  adb('forward', 'tcp:9225', 'localabstract:' + socket);

  let page;
  for (let i = 0; i < 20; i++) {
    const targets = await (await fetch('http://127.0.0.1:9225/json')).json();
    page = targets.find(target => target.type === 'page' && target.url?.includes('dartscore-pro'));
    if (page) break;
    await delay(500);
  }
  assert.ok(page, 'DartScore WebView target must be reachable');
  ws = new WebSocket(page.webSocketDebuggerUrl.replace('localhost', '127.0.0.1'));
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    if (!response.id || !callbacks.has(response.id)) return;
    const { resolve, reject } = callbacks.get(response.id);
    callbacks.delete(response.id);
    if (response.error) reject(new Error(JSON.stringify(response.error)));
    else resolve(response.result);
  });
  async function evaluate(expression) {
    const id = ++sequence;
    const response = new Promise((resolve, reject) => callbacks.set(id, { resolve, reject }));
    ws.send(JSON.stringify({
      id, method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise: true }
    }));
    const result = await response;
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  let before;
  for (let i = 0; i < 35; i++) {
    before = await evaluate('({url: location.href, width: innerWidth, scrollWidth: document.documentElement?.scrollWidth ?? 0, nativeInsets: document.documentElement?.classList.contains("native-android-insets") ?? false, lobby: !!document.querySelector(".lobbyWrap"), premium: (() => { try { return localStorage.getItem("premium"); } catch { return null; } })(), bridge: typeof window.DartScoreAndroid?.requestInterstitialEvent, analytics: typeof window.DartScoreAndroid?.logAnalyticsEvent})');
    if (before.lobby && before.nativeInsets) break;
    await delay(500);
  }
  assert.ok(before.lobby, 'lobby is rendered');
  assert.ok(before.nativeInsets, 'Android insets class applied to native WebView');
  assert.ok(before.scrollWidth <= before.width + 2, 'no horizontal overflow in Android WebView');
  // Google Play may restore a Premium purchase even after pm clear. Force Free
  // only inside this debug emulator so the ad code can still be exercised.
  if (before.premium === 'true') {
    await evaluate('localStorage.setItem("premium", "false"); window.DartScoreAndroid.setPremium(false); true');
    await delay(500);
    before.premium = await evaluate('localStorage.getItem("premium")');
    before.emulatorForcedFree = true;
  }
  assert.notEqual(before.premium, 'true', 'regression must run as Free user');
  assert.equal(before.bridge, 'function');
  assert.equal(before.analytics, 'function');

  // Simulate the two concurrent events normally issued after a Free X01 win.
  await evaluate('window.DartScoreAndroid.logAnalyticsEvent("analytics_event=game_completed&game_type=classic&plan_tier=free"); true');
  await delay(250);
  const afterAnalytics = await evaluate('location.href');
  assert.equal(afterAnalytics, before.url, 'Analytics must not navigate or close the scoring WebView');
  await evaluate('window.DartScoreAndroid.requestInterstitialEvent("ad_event=completed&mode=classic&score=501&legs=1&sets=1"); true');
  await delay(5200);
  let activities = adb('shell', 'dumpsys', 'activity', 'activities');
  // Dismiss a test network's full-screen ad only when it actually covers the app.
  if (!activities.match(/topResumedActivity=.*MainWebViewActivity/)) {
    adb('shell', 'input', 'keyevent', '4');
    await delay(1800);
    activities = adb('shell', 'dumpsys', 'activity', 'activities');
  }
  assert.match(activities, /topResumedActivity=.*MainWebViewActivity/, 'game Activity must return to foreground after ad attempt');
  const after = await evaluate('({url: location.href, lobby: !!document.querySelector(".lobbyWrap")})');
  assert.equal(after.url, before.url);
  assert.equal(after.lobby, true);
  const finalGeometry = await evaluate('({width: innerWidth, scrollWidth: document.documentElement.scrollWidth})');
  assert.ok(finalGeometry.scrollWidth <= finalGeometry.width + 2, 'no clipping after ad');
  assert.ok(adb('shell', 'pidof', pkg), 'Android app process must survive the ad attempt');
  const recent = adb('logcat', '-d', '-s', 'AndroidRuntime:E', 'DartScoreAdMob:D');
  assert.doesNotMatch(recent, /FATAL EXCEPTION/, 'no fatal native crash');
  const summary = { before, after, resumed: true, api: adb('shell', 'getprop', 'ro.build.version.sdk'), recentLog: recent.slice(-3500) };
  writeFileSync(output + '/results.json', JSON.stringify(summary, null, 2));
  writeFileSync(output + '/screenshot.png', execFileSync(adbBin, ['exec-out', 'screencap', '-p'], { timeout: 25000 }));
  console.log('PASS Android emulator: Analytics + interstitial completed without closing the scoring app', summary.api);
} finally {
  try { ws?.close(); } catch {}
  try { adb('forward', '--remove', 'tcp:9225'); } catch {}
}
