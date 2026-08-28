const fs = require('fs');
const path = require('path');
const { stampWindowsExecutable } = require('./stamp-icon.cjs');

const pkg = require('../package.json');
const icoPath = path.join(__dirname, '..', 'assets', 'icon.ico');

async function stampIfExe(file) {
  if (!file || !String(file).toLowerCase().endsWith('.exe') || !fs.existsSync(file)) return;
  stampWindowsExecutable(file, {
    icoPath,
    version: pkg.version,
    productName: pkg.productName || 'HyperFramesSpace'
  });
}

module.exports = async function stampPackedExecutables(context) {
  if (context && Array.isArray(context.artifactPaths)) {
    for (const file of context.artifactPaths) await stampIfExe(file);
    return;
  }
  if (context && context.electronPlatformName && context.electronPlatformName !== 'win32') return;
  if (!context || !context.appOutDir) return;
  const name = (context.packager && context.packager.appInfo && context.packager.appInfo.productFilename) || 'HyperFramesSpace';
  await stampIfExe(path.join(context.appOutDir, name + '.exe'));
  const electronExe = path.join(context.appOutDir, 'electron.exe');
  if (fs.existsSync(electronExe)) await stampIfExe(electronExe);
};
