#!/usr/bin/env bash
# One shell invocation is required by reactivecircus/android-emulator-runner:
# its multi-line "script" is executed command by command.
set -euo pipefail

pkg="com.randis2288.dartscorepro"
apk="DartScorePro_v100_1.1.66.apk"
log_file="dartscore-v100-1.1.66-startup-logcat.txt"
activity_file="dartscore-v100-1.1.66-activities.txt"

adb install -r "$apk"
adb logcat -c
# Do not use -W: the Android 16 CI emulator sometimes times out waiting
# for a first frame even if the app was started successfully.
adb shell am start -n "$pkg/.ConsentLauncherActivity"
sleep 30

adb logcat -d -v threadtime > "$log_file" || true
adb shell dumpsys activity activities > "$activity_file" || true

# Scan actual AndroidRuntime fatal exception blocks for this package.
if adb logcat -d -s AndroidRuntime:E | grep -A 50 'FATAL EXCEPTION' | grep -F "Process: $pkg"; then
  echo "FAIL: AndroidRuntime fatal exception in $pkg"
  grep -A 50 'FATAL EXCEPTION' "$log_file" | tail -80 || true
  exit 1
fi

pid="$(adb shell pidof "$pkg" | tr -d '\r' || true)"
if [[ -z "$pid" ]]; then
  echo "FAIL: no $pkg process after startup"
  tail -100 "$log_file"
  exit 1
fi

# An alive process can still be stuck in the consent launcher. Verify that
# the main scoring activity has actually been entered.
if ! grep -q 'com.randis2288.dartscorepro/.MainWebViewActivity' "$activity_file"; then
  echo "FAIL: main scoring activity never appeared (possible UMP hang)"
  grep -E 'topResumedActivity|mResumedActivity|Hist #|ConsentLauncherActivity|MainWebViewActivity' "$activity_file" | tail -50 || true
  exit 1
fi

echo "PASS: v100 (1.1.66) Android process $pid is alive and MainWebViewActivity is present."
