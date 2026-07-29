const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
const bakPath = swPath + '.bak';

if (fs.existsSync(bakPath)) {
  fs.copyFileSync(bakPath, swPath);
  fs.unlinkSync(bakPath);
}