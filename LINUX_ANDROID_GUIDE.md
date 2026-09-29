# Linux Android Development Guide (No Android Studio)

This project now uses an Expo **development build**: your own installable version of Expo Go that includes `expo-notifications`. Build and install it once, then JavaScript/TypeScript and asset changes appear on the phone through Fast Refresh. You do **not** build or reinstall an APK for normal UI or notification-logic changes.

> Status on this machine (verified Sep 2026): the per-user SDK at `~/Android/Sdk` (platform android-36, build-tools 36, platform-tools, NDK 27) and JDK 17 via mise are installed, and `npm run apk:debug` produces a working `app-debug.apk` (incremental rebuild ≈20s after the slow first build). Skip to [The Daily Workflow](#the-daily-workflow) once the app is installed on the phone.

## The Daily Workflow

1. Connect the phone and computer to the same Wi-Fi network.
2. From this directory, run:
   ```bash
   npm start
   ```
3. **Do not use Expo Go.** Open the installed **NoteDown** development app on the phone. It reconnects to Metro automatically; otherwise scan the QR code with the phone's normal Camera app and choose NoteDown when prompted.
4. Save a `.ts` or `.tsx` file. Fast Refresh updates the app in seconds. Press `r` in the Metro terminal for a full JavaScript reload.

Use `npm run start:tunnel` only when LAN discovery is blocked (for example, restrictive Wi-Fi). It is slower than the default LAN connection. If the phone is plugged in by USB but on a different network, run this once so Metro is reachable over the cable, then `npm start`:
```bash
npm run usb:metro
```

## One-time Phone Setup

1. Enable **Developer options** on the phone: tap *Build number* seven times in *Settings → About phone*.
2. Enable **USB debugging** in *Developer options*.
3. Connect the phone by USB with the screen unlocked, accept the **"Allow USB debugging?"** RSA prompt on the phone (tick *Always allow*), then check it:
   ```bash
   ~/Android/Sdk/platform-tools/adb devices
   ```
   The device must show `device`, not `unauthorized` or empty. If it says `unauthorized`, unplug/replug the cable and accept the prompt again; the prompt only appears while the screen is on.

The USB cable is only needed for the first install and direct APK installs. Daily Fast Refresh works over the same Wi-Fi network. Expo Go cannot open the QR code created by `npm start` because this app needs its own native development client for notifications.

## One-time Linux Setup

Local Android builds need the Android command-line SDK and JDK 17, but not Android Studio or an emulator. This computer's current Java 25/26 and old `/opt/android-sdk/tools` installation are not suitable: use the following per-user setup instead.

### 1. Use JDK 17

This machine already has [mise](https://mise.jdx.dev/). Install JDK 17:
```bash
mise install java@17
mise exec java@17 -- java -version
```

The last command must report Java 17. Do not build this Expo SDK 54 project with Java 25 or 26. The project Android scripts select this JDK automatically, so no global Java change is needed.

### 2. Install the Android command-line SDK

The following uses `~/Android/Sdk`, so it does not alter the incomplete SDK under `/opt` or require `sudo`. Download the current **Command line tools only – Linux** archive from [Android Developers](https://developer.android.com/studio), then run these commands with the downloaded archive name substituted if it has changed:
```bash
export ANDROID_HOME="$HOME/Android/Sdk"
mkdir -p "$ANDROID_HOME/cmdline-tools"
unzip ~/Downloads/commandlinetools-linux-15859902_latest.zip -d /tmp/android-command-line-tools
mv /tmp/android-command-line-tools/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
```

The project scripts use this SDK path automatically. Add these lines to `~/.bashrc` only if you also want to use `adb` and `sdkmanager` directly, then open a new terminal:
```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
```

Install the platform required by Expo SDK 54 and accept the licenses:
```bash
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"
sdkmanager --licenses
adb version
```

If `sdkmanager` cannot start, check `java -version` first; it must be Java 17.

### 3. Install project packages

```bash
npm install
```

`expo-dev-client` is already recorded in `package.json`. Do not install the old global `expo-cli`; this project uses the Expo CLI bundled with the local `expo` dependency.

## Build the Development App Once

With USB debugging enabled and `adb devices` showing your phone:
```bash
npm run android:device
```

This generates the ignored `android/` directory, builds a debug APK on your Linux machine, installs it on the selected phone, and starts Metro. It is the only build needed for ordinary app-code edits. Android notification permissions and scheduled local notifications work in this development app.

For an SDK 54 build with release-like native performance while retaining development tools, use:
```bash
npm run android:fast
```

### When a Rebuild Is Required

Run `npm run android:device` again after any of these changes:

- adding/updating a package with native Android code;
- modifying `app.json`, a config plugin, app icon, package name, or permissions;
- editing files inside the generated `android/` directory.

For `.ts`, `.tsx`, `.js`, `.jsx`, and normal asset changes, only run `npm start`; no APK build is needed.

## Fast Local APKs

The first local build is slow (Gradle downloads its distribution and dependencies once). Later incremental builds take under a minute. To create a local debug development APK without waiting for EAS:
```bash
npm run apk:debug
```

The file is at `android/app/build/outputs/apk/debug/app-debug.apk`. Install it over USB with:
```bash
npm run apk:install
# one-step shortcut that builds and installs:
npm run apk:device
```

This debug APK is for your own device/testing and still connects to Metro, so run `npm start` before opening it. It is signed with the local debug key and is not a Play Store release.

To make a standalone local test APK that includes the JavaScript bundle:
```bash
npm run apk:release
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

The release APK is also signed with the local debug key. It is useful for fast on-device testing but cannot be submitted to Google Play; use the signed EAS `production` build for store releases.

## EAS Fallback Profiles

The local workflow is fastest because it avoids upload, build queue, and download time. EAS remains useful when you need a build without your Linux machine:

```bash
# Development client APK (one-time fallback; then use npm start for live updates)
npx eas build --platform android --profile development

# Development client with the SDK 54 debugOptimized Gradle task
npx eas build --platform android --profile development-fast

# Installable non-development APK for sharing/testing
npx eas build --platform android --profile preview
```

Log in first with `npx eas login` if required. Every EAS development build still supports the same Fast Refresh workflow after installation.

## Troubleshooting

### Check the toolchain

```bash
npm run doctor
```

This prints the JDK (must be 17), `adb`, installed SDK platforms, and the Expo version, using the same environment as the build scripts.

### `adb devices` shows `unauthorized`

The phone is connected but the RSA prompt was not accepted yet. Keep the phone screen on, unplug/replug USB, accept **Allow USB debugging** (tick *Always allow*), then run `adb devices` again until it says `device`. If the prompt never appears, toggle USB debugging off/on in Developer options and set USB mode to *File transfer*.

### `adb devices` shows no device

Reconnect the cable, select *File transfer* USB mode, accept the phone's RSA debugging prompt, then run `adb kill-server` followed by `adb devices`. If Linux reports a USB permission error, install the appropriate Android `udev` rules for your distribution and reconnect the phone.

### Development app cannot reach Metro

Confirm the phone and computer use the same Wi-Fi, start Metro with `npm start`, and open the app again. If they are on different networks but the phone is on USB, run `npm run usb:metro` once, then `npm start`. If LAN is blocked entirely, stop Metro and use `npm run start:tunnel`. A firewall may need TCP port `8081` opened:
```bash
sudo ufw allow 8081/tcp
```

### `ENOSPC: System limit for number of file watchers reached`

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### APK installation fails

An old APK signed with a different key cannot be updated in place. Uninstall the existing NoteDown app from the phone, then install the new debug APK. This clears the app's local SQLite notes, so export/backup data first if necessary.

## Project Files

- `app.json`: Android app settings and native plugins, including `expo-dev-client` and `expo-notifications`.
- `eas.json`: EAS development, fast development, preview, and production profiles.
- `scripts/with-android-toolchain.sh`: pins JDK 17 + `~/Android/Sdk` for every local Android command (used by `android:device`, `apk:*`, `doctor`).
- `scripts/android-usb-reverse.sh`: `adb reverse` so Metro works over USB (`npm run usb:metro`).
- `src/utils/notifications.ts`: local notification permission, channels, and scheduling logic.
