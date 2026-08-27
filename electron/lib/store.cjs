const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  scanRoots: [
    'C:\\Users\\M',
    'C:\\Users\\M\\Videos',
    'C:\\Users\\M\\Documents\\转转视觉优化'
  ],
  defaultAgent: 'grok',
  terminal: 'wt',
  coverLayout: '9',
  coverAtSec: 'auto',
  hoverShowMs: 280,
  hoverHideMs: 200,
  cardSize: 'm',
  scanIntervalSec: 0,
  autoScanOnLaunch: false,
  scanScope: 'all-fixed',
  scanEngine: 'auto',
  autoSnapshot: false,
  catalogUrl: 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/catalog.json',
  customCollections: null,
  pinnedFolders: [],
  locale: 'zh',
  latestPin: ''
};

function filePath(userData) {
  return path.join(userData, 'settings.json');
}

function isDir(target) {
  try { return !!(target && fs.existsSync(target) && fs.statSync(target).isDirectory()); }
  catch (_) { return false; }
}

function sameRoot(a, b) {
  return String(a || '').replace(/[\\/]+$/, '').toLowerCase() === String(b || '').replace(/[\\/]+$/, '').toLowerCase();
}

function load(userData) {
  const dest = filePath(userData);
  let extra = {};
  try { extra = JSON.parse(fs.readFileSync(dest, 'utf8')); } catch (_) {}
  const out = Object.assign({}, DEFAULTS, extra);
  if (!Array.isArray(out.scanRoots) || !out.scanRoots.length) {
    out.scanRoots = DEFAULTS.scanRoots.slice();
  }
  if (out.scanScope !== 'roots') out.scanScope = 'all-fixed';
  if (!['auto', 'usn', 'everything', 'walk'].includes(out.scanEngine)) out.scanEngine = 'auto';
  out.autoScanOnLaunch = !!out.autoScanOnLaunch;
  return out;
}

function save(userData, patch) {
  const next = Object.assign(load(userData), patch || {});
  fs.mkdirSync(userData, { recursive: true });
  fs.writeFileSync(filePath(userData), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

function reset(userData) {
  const dest = filePath(userData);
  try { fs.unlinkSync(dest); } catch (_) {}
  return save(userData, {
    scanRoots: DEFAULTS.scanRoots.slice(),
    autoScanOnLaunch: false,
    scanScope: 'all-fixed',
    scanEngine: 'auto'
  });
}

module.exports = {
  DEFAULTS,
  isDir,
  sameRoot,
  load,
  save,
  reset,
  filePath
};
