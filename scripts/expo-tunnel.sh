#!/bin/bash
export EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN:5000

npx expo start --tunnel 2>&1 | while IFS= read -r line; do
  printf '%s\n' "$line"
  if printf '%s\n' "$line" | grep -qo 'exp://[^ ]*\.exp\.direct'; then
    printf '%s\n' "$line" | grep -o 'exp://[^ ]*\.exp\.direct' > /tmp/expo-tunnel-url.txt
  fi
done
