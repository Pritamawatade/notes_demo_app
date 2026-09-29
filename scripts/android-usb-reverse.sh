#!/usr/bin/env bash
# Point Metro at a USB-connected phone so the dev client works even
# when the phone and PC are not on the same Wi-Fi network.
set -euo pipefail
adb reverse tcp:8081 tcp:8081
echo "USB reverse proxy set: phone -> PC port 8081. Now run: npm start"
