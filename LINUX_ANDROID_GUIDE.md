# Linux Android Development Guide (No Android Studio)

This guide provides everything you need to develop, run, and build your NoteDown app on Linux without ever installing Android Studio.

## 1. Prerequisites (One-time Setup)

### Install Node.js & npm
Use `nvm` (Node Version Manager) for the best experience on Linux.
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### Install Expo CLI & EAS CLI
```bash
npm install -g expo-cli eas-cli
```

## 2. Project Setup
In this directory, install the project dependencies:
```bash
npm install
```

## 3. Running the App Locally (Expo Go)

Since we are avoiding Android Studio (and thus the Android Emulator), the best way to test is on a **real Android phone**.

1. Install the **Expo Go** app from the Google Play Store on your phone.
2. Connect your phone and Linux machine to the **same Wi-Fi network**.
3. Start the development server:
   ```bash
   npx expo start
   ```
4. A QR code will appear in your terminal.
5. Open the Expo Go app on your phone and tap **"Scan QR Code"**.
6. The app will load and run on your phone!

**USB Debugging Alternative:**
If Wi-Fi is unstable, enable **USB Debugging** in your phone's Developer Options, connect via USB, and run:
```bash
npx expo start --android
```

## 4. Building the APK (Production)

We use **EAS Build** to generate the APK in the cloud. This completely removes the need for a local Android SDK or Android Studio.

### Step A: Create an Expo Account
If you don't have one, create it at [expo.dev](https://expo.dev). Then log in via terminal:
```bash
eas login
```

### Step B: Configure Build
Run this once to initialize the build configuration:
```bash
eas build:configure
```
Choose `android` when prompted.

### Step C: Generate the APK
Run this command to start a cloud build that results in a downloadable `.apk` file:
```bash
eas build -p android --profile preview
```
*Note: The `--profile preview` is configured to output an APK instead of an AAB (Play Store format).*

Once finished, EAS will provide a link to download the APK.

## 5. Installing the APK on your Phone
1. Download the APK file to your Linux machine or directly to your phone.
2. If on Linux, you can send it to your phone via USB or a service like Snapdrop/Telegram.
3. On your phone, tap the APK file to install it.
4. You may need to "Allow installation from unknown sources" in your phone's settings.

## 6. Manual Backup of Notes
The notes are stored in a SQLite database file on your phone.
If you need to back up manually:
1. The app will eventually have a "Export to JSON" feature (added in utilities).
2. For now, data persists locally in `/data/data/com.yourname.notedown/databases/notes.db` (requires root to access directly via file explorer).

## 7. Troubleshooting Linux Issues

### Issue: `ENOSPC: System limit for number of file watchers reached`
**Fix:**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

### Issue: Expo Go can't connect to Linux machine
**Fix:** Check your Linux firewall (ufw).
```bash
sudo ufw allow 19000/tcp
sudo ufw allow 19001/tcp
```

### Issue: APK Installation Failed
**Fix:** Ensure you don't have a version of the app with a different signature already installed. Uninstall the old version first.

---

## Folder Structure
- `App.tsx`: Main entry point and Navigation setup.
- `src/database/db.ts`: SQLite database logic (Local-first).
- `src/screens/`: App screens (Home, Editor).
- `src/components/`: Reusable UI elements (NoteCard).
- `src/theme/Colors.ts`: Dark/Light mode color palettes.
