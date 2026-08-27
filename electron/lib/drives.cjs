const fs = require('fs');

function listFixedDrives() {
  const found = [];
  for (let code = 65; code <= 90; code++) {
    const rootPath = String.fromCharCode(code) + ':\\';
    try {
      if (fs.existsSync(rootPath)) found.push(rootPath);
    } catch (_) {}
  }
  return found;
}

module.exports = { listFixedDrives };
