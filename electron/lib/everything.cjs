const fs = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');

function candidateEsPaths() {
  return [
    process.env.EVERYTHING_ES_PATH,
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Everything', 'es.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Everything', 'es.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Everything', 'es.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Everything', 'es.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'es.exe')
  ].filter(Boolean);
}

function isEverythingRunning() {
  try {
    const out = execFileSync('tasklist', ['/FI', 'IMAGENAME eq Everything.exe', '/NH'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000
    });
    return /everything\.exe/i.test(out);
  } catch (_) {
    return false;
  }
}

function findEs() {
  for (const p of candidateEsPaths()) {
    try { if (p && fs.existsSync(p)) return p; } catch (_) {}
  }
  try {
    const out = execFileSync('where', ['es.exe'], { encoding: 'utf8', windowsHide: true, timeout: 3000 });
    const first = String(out).split(/\r?\n/).map((s) => s.trim()).find(Boolean);
    if (first && fs.existsSync(first)) return first;
  } catch (_) {}
  return '';
}

function probe() {
  const running = isEverythingRunning();
  const esPath = findEs();
  return {
    running,
    esPath,
    available: !!(esPath && running)
  };
}

function queryHyperframes(esPath, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (!esPath) return reject(new Error('es.exe not found'));
    execFile(esPath, ['-n', '20000', 'wfn:hyperframes.json'], {
      windowsHide: true,
      timeout: timeoutMs || 20000,
      maxBuffer: 20 * 1024 * 1024
    }, (err, stdout) => {
      if (err) return reject(err);
      const dirs = [];
      const seen = new Set();
      String(stdout || '').split(/\r?\n/).forEach((line) => {
        const file = String(line || '').trim().replace(/^["']|["']$/g, '');
        if (!file) return;
        const dir = path.dirname(file);
        const key = path.normalize(dir).toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        dirs.push(dir);
      });
      resolve(dirs);
    });
  });
}

module.exports = { probe, queryHyperframes, findEs, isEverythingRunning, candidateEsPaths };
