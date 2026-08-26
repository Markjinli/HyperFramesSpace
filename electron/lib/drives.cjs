const fs = require('fs');
const { execFileSync } = require('child_process');

function listFixedDrives() {
  const found = [];
  try {
    const out = execFileSync('wmic', ['logicaldisk', 'where', 'drivetype=3', 'get', 'name'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 4000
    });
    String(out).split(/\r?\n/).forEach((line) => {
      const m = String(line).trim().match(/^([A-Za-z]):/);
      if (m) found.push(m[1].toUpperCase() + ':\\');
    });
  } catch (_) {}
  if (found.length) return Array.from(new Set(found));
  const fallback = [];
  for (let code = 67; code <= 90; code++) {
    const rootPath = String.fromCharCode(code) + ':\\';
    try {
      if (fs.existsSync(rootPath)) fallback.push(rootPath);
    } catch (_) {}
  }
  return fallback;
}

module.exports = { listFixedDrives };
