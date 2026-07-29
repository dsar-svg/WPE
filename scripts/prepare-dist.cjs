#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const mode = process.argv[2]; // 'admin' or 'pos'

function copySync(src, dest) {
  fs.copyFileSync(path.resolve(src), path.resolve(dest));
}

function removeSync(filePath) {
  try { fs.unlinkSync(path.resolve(filePath)); } catch {}
}

if (mode === 'admin') {
  copySync('dist-admin/admin.html', 'dist-admin/index.html');
  copySync('vercel-admin.json', 'dist-admin/vercel.json');
  copySync('public/manifest-admin.json', 'dist-admin/manifest.json');
  removeSync('dist-admin/manifest-admin.json');
  removeSync('dist-admin/manifest-pos.json');
  console.log('Admin dist prepared.');
} else if (mode === 'pos') {
  copySync('dist-pos/pos.html', 'dist-pos/index.html');
  copySync('vercel-pos.json', 'dist-pos/vercel.json');
  copySync('public/manifest-pos.json', 'dist-pos/manifest.json');
  removeSync('dist-pos/manifest-admin.json');
  removeSync('dist-pos/manifest-pos.json');
  console.log('POS dist prepared.');
}
