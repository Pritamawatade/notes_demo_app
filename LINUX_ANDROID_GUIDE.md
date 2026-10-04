# Android Guide: Preview & Test APK

Two scenarios. That's it.

## One-time setup (phone + PC)

1. Phone: tap *Build number* 7 times (*Settings → About phone*), then enable **USB debugging** in *Developer options*.
2. Plug in USB, accept **Allow USB debugging** on the phone (tick *Always allow*), then verify:
   ```bash
   ~/Android/Sdk/platform-tools/adb devices
   ```
   Must show `device`, not `unauthorized`.
3. Install packages once: `npm install`

> The toolchain (JDK 17 + `~/Android/Sdk`) is already on this machine and picked up automatically by every `npm run` script below.

---

## 1. Dev preview with hot reload

For normal `.ts` / `.tsx` / asset edits. You build the app **once**, then code changes appear on the phone in seconds via Fast Refresh. Never rebuild for JS-only changes.

**First time only** (builds + installs the dev app on your phone):

```bash
npm run android:device
```

**Every day after that:**

Same Wi-Fi on phone + PC:

```bash
npm start
```

Open the **NoteDown** app on your phone (not Expo Go). Save any file → it updates live. Press `r` in the terminal for a full reload.

Different Wi-Fi (USB cable instead):

```bash
# terminal 1
npm run usb:metro
# terminal 2
npx expo start --dev-client --localhost
```

Then press `a` in the Metro terminal. Don't scan the QR — it points at Wi-Fi, which won't reach. Don't press `s` either (that switches to Expo Go, which this app can't use).

**Rebuild** with `npm run android:device` only when you change native stuff: add/update a native package, edit `app.json`, icons, permissions, or anything under `android/`.

---

## 2. Build a test APK for your phone

Standalone file you install and open like a normal app — no Metro, no cable needed afterwards.

```bash
# build + install over USB in one step:
npm run apk:device
```

Or step by step:

```bash
npm run apk:release
bash scripts/with-android-toolchain.sh adb install -r android/app/build/outputs/apk/release/app-release.apk
```

The APK is signed with your local debug key: fine for your own testing, **not** for the Play Store (that needs the signed EAS `production` build).

---

## If something breaks

| Symptom | Fix |
|---|---|
| `adb devices` empty / `unauthorized` | Screen on, unplug/replug, accept the RSA prompt; USB mode → *File transfer* |
| Install fails with verification error | `bash scripts/with-android-toolchain.sh bash -c 'adb shell settings put global verifier_verify_adb_installs 0'` then install again; or disable Play Protect scanning on the phone |
| App can't reach Metro (port 8081 timeout) | Same Wi-Fi? If not, use the USB flow above. Else `sudo ufw allow 8081/tcp` |
| Install fails: signature mismatch | Uninstall NoteDown from the phone first (this wipes local notes), then install |
| Wrong Java / SDK errors | `npm run doctor` — Java must be 17 |
