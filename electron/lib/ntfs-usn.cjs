'use strict';

const fs = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');

function helperPath() {
  const packed = process.resourcesPath
    ? path.join(process.resourcesPath, 'hf-ntfs-locate.exe')
    : '';
  if (packed && fs.existsSync(packed)) return packed;
  const dev = path.join(__dirname, '..', '..', 'native', 'hf-ntfs-locate.exe');
  if (fs.existsSync(dev)) return dev;
  return '';
}

function cachePath(userData) {
  return path.join(userData, 'ntfs-index.json');
}

function loadCache(userData) {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath(userData), 'utf8'));
    if (!raw || !Array.isArray(raw.dirs)) return null;
    return raw;
  } catch (_) {
    return null;
  }
}

function saveCache(userData, payload) {
  payload = payload || {};
  fs.mkdirSync(userData, { recursive: true });
  const body = {
    savedAt: Date.now(),
    engine: 'usn',
    dirs: uniqueDirs(payload.dirs || []),
    volumes: payload.volumes || []
  };
  fs.writeFileSync(cachePath(userData), JSON.stringify(body), 'utf8');
  return body;
}

function uniqueDirs(list) {
  const seen = new Set();
  const out = [];
  (list || []).forEach((dir) => {
    const full = String(dir || '').trim();
    if (!full) return;
    const key = path.normalize(full).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(full);
  });
  return out;
}

function parseJson(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); }
  catch (_) { return null; }
}

function runOnce(exe, args, timeoutMs) {
  return new Promise((resolve) => {
    execFile(exe, args, {
      windowsHide: true,
      timeout: timeoutMs || 180000,
      maxBuffer: 20 * 1024 * 1024
    }, (err, stdout, stderr) => {
      const parsed = parseJson(stdout) || parseJson(stderr);
      const code = err && err.code;
      if (parsed) {
        parsed.ok = parsed.ok !== false;
        parsed.needsElevation = !!parsed.needsElevation || code === 5;
        parsed.error = parsed.error || (err && !parsed.ok ? (err.message || String(err)) : '');
        return resolve(parsed);
      }
      if (code === 5 || /access is denied|740/i.test(String(err && err.message))) {
        return resolve({ ok: false, needsElevation: true, dirs: [], error: 'access-denied' });
      }
      resolve({
        ok: false,
        needsElevation: false,
        dirs: [],
        error: err ? (err.message || String(err)) : 'empty-output'
      });
    });
  });
}

function elevateOnce(exe, args, timeoutMs) {
  const argLine = args.map((a) => "'" + String(a).replace(/'/g, "''") + "'").join(',');
  const cmd = "Start-Process -FilePath '" + String(exe).replace(/'/g, "''") + "' -ArgumentList @(" + argLine + ") -Verb RunAs -Wait -WindowStyle Hidden";
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', cmd], {
      windowsHide: true,
      timeout: timeoutMs || 240000
    }, (err) => {
      if (err) {
        const msg = err.message || String(err);
        const cancelled = /canceled|cancelled|1223|operation was canceled/i.test(msg);
        resolve({
          ok: false,
          needsElevation: true,
          cancelled: cancelled,
          dirs: [],
          error: cancelled ? 'uac-cancelled' : msg
        });
        return;
      }
      resolve({ ok: true });
    });
  });
}

async function locate(opts) {
  opts = opts || {};
  const userData = opts.userData;
  const exe = helperPath();
  if (!exe) {
    return { ok: false, engine: 'usn', helper: false, dirs: [], error: 'helper-missing' };
  }
  const outFile = path.join(userData, 'ntfs-index-raw.json');
  const args = ['--name', 'hyperframes.json', '--out', outFile];
  let result;
  if (opts.elevate) {
    const lifted = await elevateOnce(exe, args, opts.timeoutMs);
    if (!lifted.ok) return Object.assign({ engine: 'usn', helper: true }, lifted);
    try {
      result = parseJson(fs.readFileSync(outFile, 'utf8')) || { ok: false, dirs: [], error: 'no-output' };
    } catch (err) {
      result = { ok: false, dirs: [], error: err.message || String(err) };
    }
  } else {
    result = await runOnce(exe, args, opts.timeoutMs);
    if ((!result || !result.ok) && fs.existsSync(outFile)) {
      const fromFile = parseJson(fs.readFileSync(outFile, 'utf8'));
      if (fromFile) result = fromFile;
    }
  }
  result = result || { ok: false, dirs: [] };
  result.engine = 'usn';
  result.helper = true;
  result.dirs = uniqueDirs(result.dirs || []).filter((dir) => {
    try { return fs.existsSync(dir); } catch (_) { return false; }
  });
  if (result.ok && result.dirs) saveCache(userData, result);
  return result;
}

function filterToRoots(dirs, roots) {
  if (!Array.isArray(roots) || !roots.length) return dirs;
  const prefixes = roots.map((r) => path.normalize(r).toLowerCase().replace(/[\\/]+$/, ''));
  return dirs.filter((dir) => {
    const n = path.normalize(dir).toLowerCase();
    return prefixes.some((p) => n === p || n.startsWith(p + path.sep) || n.startsWith(p + '\\'));
  });
}

module.exports = {
  helperPath,
  cachePath,
  loadCache,
  saveCache,
  uniqueDirs,
  parseJson,
  locate,
  filterToRoots
};
