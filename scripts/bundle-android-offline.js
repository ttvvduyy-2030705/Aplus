const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'android', 'app', 'src', 'main', 'assets');
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');

fs.mkdirSync(assetsDir, {recursive: true});
fs.mkdirSync(resDir, {recursive: true});

// Script này chỉ sinh JS bundle offline. Không khởi động Metro.
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
  'react-native',
  'bundle',
  '--platform', 'android',
  '--dev', 'false',
  '--entry-file', 'index.js',
  '--bundle-output', path.join(assetsDir, 'index.android.bundle'),
  '--assets-dest', resDir,
  '--reset-cache',
], {
  cwd: root,
  stdio: 'inherit',
});

console.log('Đã sinh android/app/src/main/assets/index.android.bundle');
