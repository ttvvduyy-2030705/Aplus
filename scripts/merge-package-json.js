const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.name = 'Aplus';
pkg.scripts = {
  ...pkg.scripts,
  'android:bundle:offline': 'node scripts/bundle-android-offline.js',
  'android:patch-offline-bundle': 'node scripts/patch-android-offline-bundle.js',
};
pkg.devDependencies = {
  ...pkg.devDependencies,
  'babel-plugin-module-resolver': pkg.devDependencies?.['babel-plugin-module-resolver'] ?? 'latest',
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('Đã merge package.json cho Aplus Batch 00.');
