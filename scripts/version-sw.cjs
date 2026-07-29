const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
const bakPath = swPath + '.bak';
const content = fs.readFileSync(swPath, 'utf-8');

// Backup original
fs.copyFileSync(swPath, bakPath);

// Replace __VERSION__ with current timestamp
const versioned = content.replace(/__VERSION__/g, Date.now().toString());
fs.writeFileSync(swPath, versioned, 'utf-8');