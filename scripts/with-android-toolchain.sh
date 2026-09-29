#!/usr/bin/env bash
# Run any Android/Gradle command with the correct JDK + SDK, without Android Studio.
# - JDK 17 via mise (required by Expo SDK 54 / AGP)
# - Android cmdline SDK at ~/Android/Sdk (falls back to $ANDROID_HOME / /opt/android-sdk)
set -euo pipefail

resolve_java_home() {
  if [[ -n "${JAVA17_HOME:-}" && -x "$JAVA17_HOME/bin/java" ]]; then
    echo "$JAVA17_HOME"
    return 0
  fi
  if command -v mise >/dev/null 2>&1; then
    local p
    p="$(mise where java@17 2>/dev/null || true)"
    if [[ -n "$p" && -x "$p/bin/java" ]]; then
      echo "$p"
      return 0
    fi
  fi
  for candidate in "$HOME/.local/share/mise/installs/java/17.0.2" "/usr/lib/jvm/java-17-openjdk"; do
    if [[ -x "$candidate/bin/java" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

resolve_sdk_root() {
  # Prefer the complete per-user SDK first; $ANDROID_HOME on this machine
  # points at an old incomplete /opt/android-sdk (no platforms).
  for candidate in "$HOME/Android/Sdk" "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "/opt/android-sdk"; do
    if [[ -n "$candidate" && -d "$candidate/platforms/android-36" && -d "$candidate/platform-tools" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  for candidate in "$HOME/Android/Sdk" "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "/opt/android-sdk"; do
    if [[ -n "$candidate" && -d "$candidate/platforms" && -d "$candidate/platform-tools" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

java_home="$(resolve_java_home || true)"
if [[ -z "$java_home" ]]; then
  echo "JDK 17 is required. Install it with: mise install java@17" >&2
  exit 1
fi

android_sdk_root="$(resolve_sdk_root || true)"
if [[ -z "$android_sdk_root" ]]; then
  echo "No usable Android SDK found." >&2
  echo "Complete the one-time setup in LINUX_ANDROID_GUIDE.md (~/Android/Sdk with platform android-36)." >&2
  exit 1
fi

if [[ ! -d "$android_sdk_root/platforms/android-36" ]]; then
  echo "Warning: $android_sdk_root/platforms/android-36 is missing." >&2
  echo "Install it with: sdkmanager \"platform-tools\" \"platforms;android-36\" \"build-tools;36.0.0\" \"ndk;27.1.12297006\"" >&2
fi

export JAVA_HOME="$java_home"
export ANDROID_HOME="$android_sdk_root"
export ANDROID_SDK_ROOT="$android_sdk_root"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
hash -r 2>/dev/null || true

java_version="$("$JAVA_HOME/bin/java" -version 2>&1 | head -1)"
if [[ "$java_version" != *'version "17'* ]]; then
  echo "Expected JDK 17 but got: $java_version" >&2
  exit 1
fi

exec "$@"
