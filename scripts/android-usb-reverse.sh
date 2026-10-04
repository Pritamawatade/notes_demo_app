#!/usr/bin/env bash
# Point Metro at a USB-connected phone so the dev client works even
# when the phone and PC are not on the same Wi-Fi network.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Use the pinned toolchain ADB (~/Android/Sdk), not the old /opt/android-sdk one.
"$SCRIPT_DIR/with-android-toolchain.sh" adb reverse tcp:8081 tcp:8081
"$SCRIPT_DIR/with-android-toolchain.sh" adb reverse --list
echo "USB reverse proxy set: phone -> PC port 8081. Now run: npx expo start --dev-client --localhost"
