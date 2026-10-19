import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const pkg = 'com.randis2288.dartscorepro';
const adbBin = process.env.ADB_PATH || 'adb';
const apk = process.env.DARTSCORE_RELEASE_APK || 'app/build/outputs/apk/release/app-release.apk';
const adb = (...args) => execFileSync(adbBin, args, {
  encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024
}).trim();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const dir = 'build/android-release-startup-evidence';
mkdirSync(dir, { recursive: true });

adb('uninstall', pkg); // Debug APK and optimized QA release use different keys.
adb('install', apk);
adb('logcat', '-c');
adb('shell', 'am', 'start', '-n', pkg + '/.ConsentLauncherActivity');

let foreground = '';
let fatal = '';
for (let i = 0; i < 40; i++) {
  await wait(1500);
  foreground = adb('shell', 'dumpsys', 'activity', 'activities')
    .match(/topResumedActivity=.*$/m)?.[0] || '';
  const output = adb('logcat', '-d', '-s', 'AndroidRuntime:E');
  if (output.includes('FATAL EXCEPTION') && output.includes('Process: ' + pkg)) {
    fatal = output;
    break;
  }
  if (foreground.includes(pkg + '/.MainWebViewActivity')) break;
}
const result = {
  apk, androidApi: adb('shell', 'getprop', 'ro.build.version.sdk'),
  foreground, fatal: fatal.slice(-6500), success: false
};
writeFileSync(dir + '/results.json', JSON.stringify(result, null, 2));
if (fatal) throw new Error('Fatal optimized release crash: ' + fatal.slice(-5000));
assert.match(foreground, new RegExp(pkg.replace(/\./g, '\\.') + '/.MainWebViewActivity'),
  'optimized release must reach native MainWebViewActivity, not the launcher');
await wait(2000);
const now = adb('shell', 'dumpsys', 'activity', 'activities');
assert.match(now, /topResumedActivity=.*\.MainWebViewActivity/);
result.success = true;
writeFileSync(dir + '/results.json', JSON.stringify(result, null, 2));
writeFileSync(dir + '/screenshot.png', execFileSync(adbBin,
  ['exec-out', 'screencap', '-p'], { timeout: 30000 }));
console.log('PASS real optimized release Android startup, API ' + result.androidApi);
