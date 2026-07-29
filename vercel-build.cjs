#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectMap = {
  'prj_FJkCmUI0DXo4HYqmEYA2KcS1GbEu': { name: 'admin', cmd: 'npm run build:admin', src: 'dist-admin' },
  'prj_T273JCE8DGgBn2a3XljwxKyNMMCB': { name: 'pos', cmd: 'npm run build:pos', src: 'dist-pos' },
};

const projectId = process.env.VERCEL_PROJECT_ID || '';
const project = projectMap[projectId];

if (project) {
  console.log(`Building ${project.name} PWA (project: ${projectId})...`);
  execSync(project.cmd, { stdio: 'inherit' });

  const srcDir = path.resolve(project.src);
  const destDir = path.resolve('dist');
  if (fs.existsSync(srcDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
    execSync(`cp -r "${srcDir}/." "${destDir}/"`, { stdio: 'inherit' });
    console.log(`Copied ${project.src}/ → dist/ for Vercel to serve.`);
    
    const files = fs.readdirSync(destDir);
    console.log(`dist/ contents: ${files.join(', ')}`);
  }
} else {
  console.log(`Building public PWA (project: ${projectId || 'local'})...`);
  execSync('npm run build', { stdio: 'inherit' });
}
