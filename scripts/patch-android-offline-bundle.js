const fs = require('fs');
const path = require('path');

const buildGradlePath = path.resolve(__dirname, '..', 'android', 'app', 'build.gradle');

if (!fs.existsSync(buildGradlePath)) {
  console.error('KhÃ´ng tÃ¬m tháº¥y android/app/build.gradle. HÃ£y táº¡o project RN CLI trÆ°á»›c rá»“i cháº¡y láº¡i script nÃ y.');
  process.exit(1);
}

let text = fs.readFileSync(buildGradlePath, 'utf8');
const marker = '/* APLUS_OFFLINE_DEBUG_BUNDLE */';

if (text.includes(marker)) {
  console.log('android/app/build.gradle Ä‘Ã£ cÃ³ cáº¥u hÃ¬nh Aplus offline bundle.');
  process.exit(0);
}

const reactBlockRegex = /react\s*\{[\s\S]*?\n\}/m;
const insertBlock = `react {\n    ${marker}\n    // Cho phÃ©p Android Studio build Debug cÃ³ sáºµn JS bundle, khÃ´ng cáº§n má»Ÿ Metro riÃªng.\n    // Khi cáº§n debug live reload vá» sau, cÃ³ thá»ƒ Ä‘á»•i láº¡i: debuggableVariants = ["debug"]\n    debuggableVariants = []\n    bundleAssetName = "index.android.bundle"\n    entryFile = file("../../index.js")\n}`;

if (reactBlockRegex.test(text)) {
  text = text.replace(reactBlockRegex, insertBlock);
} else if (text.includes('apply plugin: "com.facebook.react"')) {
  text = text.replace('apply plugin: "com.facebook.react"', `apply plugin: "com.facebook.react"\n\n${insertBlock}`);
} else {
  console.error('KhÃ´ng tÃ¬m tháº¥y block React Native Gradle Plugin trong android/app/build.gradle. Cáº§n kiá»ƒm tra template RN hiá»‡n táº¡i.');
  process.exit(1);
}

fs.writeFileSync(buildGradlePath, text, 'utf8');
console.log('ÄÃ£ patch android/app/build.gradle Ä‘á»ƒ Debug build cÃ³ JS bundle offline.');


