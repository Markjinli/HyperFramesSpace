'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'UsnLocate.cs');
const out = path.join(__dirname, 'hf-ntfs-locate.exe');
const csc = process.env.WINDIR
  ? path.join(process.env.WINDIR, 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe')
  : '';

if (!fs.existsSync(src)) {
  console.error('missing ' + src);
  process.exit(1);
}
if (!csc || !fs.existsSync(csc)) {
  console.error('csc.exe not found; cannot build hf-ntfs-locate.exe');
  process.exit(1);
}

execFileSync(csc, [
  '/nologo',
  '/optimize+',
  '/target:exe',
  '/platform:anycpu',
  '/out:' + out,
  src
], { stdio: 'inherit' });

const stat = fs.statSync(out);
console.log('built ' + out + ' (' + stat.size + ' bytes)');
