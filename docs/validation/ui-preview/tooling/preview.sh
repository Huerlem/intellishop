#!/bin/sh
# Build and screenshot react-native-web previews of the V2 screens (scratch only).
set -e
/home/claude/work/sync-proxy.sh
cd /home/claude/work/proxy-run
mkdir -p .preview && cp /home/claude/work/preview-src/* .preview/
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));p.main='.preview/index.tsx';fs.writeFileSync('package.json',JSON.stringify(p,null,2))"
echo "module.exports = require('./.preview/metro.preview.js');" > metro.config.js
CI=1 EXPO_NO_TELEMETRY=1 node node_modules/@expo/cli/build/bin/cli export --platform web --output-dir .preview/web 2>&1 | grep -E "Exported|Error" || true
mkdir -p .preview/web/fonts && cp /usr/share/fonts/opentype/inter/Inter-Regular.otf /usr/share/fonts/opentype/inter/Inter-Medium.otf /usr/share/fonts/opentype/inter/Inter-SemiBold.otf /usr/share/fonts/opentype/inter/Inter-Bold.otf .preview/web/fonts/
NODE_PATH=$(npm root -g) node .preview/shoot.js "$@"
rm -rf /home/claude/work/preview-shots && cp -r .preview/shots /home/claude/work/preview-shots
