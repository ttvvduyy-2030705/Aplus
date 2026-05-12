const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'android', 'app', 'src', 'main', 'assets');
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');
const bundlePath = path.join(assetsDir, 'index.android.bundle');

fs.mkdirSync(assetsDir, {recursive: true});
fs.mkdirSync(resDir, {recursive: true});

if (fs.existsSync(bundlePath)) {
  fs.unlinkSync(bundlePath);
}

const cliPath = path.join(root, 'node_modules', '@react-native-community', 'cli', 'build', 'bin.js');
const env = {
  ...process.env,
  CI: process.env.CI || '1',
  FORCE_COLOR: process.env.FORCE_COLOR || '0',
  TERM: process.env.TERM || 'dumb',
};

const args = [
  'bundle',
  '--platform', 'android',
  '--dev', 'false',
  '--entry-file', 'index.js',
  '--bundle-output', bundlePath,
  '--assets-dest', resDir,
  '--reset-cache',
  '--max-workers', '2',
];

if (fs.existsSync(cliPath)) {
  execFileSync(process.execPath, [cliPath, ...args], {cwd: root, stdio: 'inherit', env});
} else {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['react-native', ...args], {
    cwd: root,
    stdio: 'inherit',
    env,
  });
}

const bundleText = fs.readFileSync(bundlePath, 'utf8');
if (!bundleText.includes('Aplus Lock')) {
  throw new Error('Bundle sinh ra chưa thấy chuỗi Aplus Lock. Kiểm tra entry-file index.js.');
}
if (bundleText.includes('billiards_management') || bundleText.includes('Aplus Billiards')) {
  throw new Error('Bundle vẫn chứa app billiards cũ. Hãy xoá cache/node_modules rồi bundle lại.');
}

console.log('Đã sinh đúng android/app/src/main/assets/index.android.bundle cho Aplus Lock.');
