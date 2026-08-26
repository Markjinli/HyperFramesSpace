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
  autoSnapshot: false,
  catalogUrl: 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/catalog.json',
  customCollections: null,
  pinnedFolders: [],
  locale: 'zh',
  latestPin: ''
};

const EXTRA_ROOT_CANDIDATES = [
  'C:\\1AI\\1cursorfull\\CLAW8Final\\videos'
];

function filePath(userData) {
  return path.join(userData, 'settings.json');
}

function isDir(p) {
  try { return !!(p && fs.existsSync(p) && fs.statSync(p).isDirectory()); }
  catch (_) { return false; }
}

function existingExtraRoots() {
  return EXTRA_ROOT_CANDIDATES.filter(isDir);
}

function sameRoot(a, b) {
  return String(a || '').replace(/[\\/]+$/, '').toLowerCase() === String(b || '').replace(/[\\/]+$/, '').toLowerCase();
}

function mergeSuggestedRoots(roots) {
  const out = Array.isArray(roots) ? roots.slice() : [];
  existingExtraRoots().forEach((p) => {
    if (!out.some((r) => sameRoot(r, p))) out.push(p);
  });
  return out;
}

function load(userData) {
  const dest = filePath(userData);
  let extra = {};
  try { extra = JSON.parse(fs.readFileSync(dest, 'utf8')); } catch (_) {}
  const out = Object.assign({}, DEFAULTS, extra);
  if (!Array.isArray(out.scanRoots) || !out.scanRoots.length) {
    out.scanRoots = DEFAULTS.scanRoots.slice();
  }
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
  return save(userData, { scanRoots: mergeSuggestedRoots(DEFAULTS.scanRoots.slice()) });
}

module.exports = {
  DEFAULTS,
  EXTRA_ROOT_CANDIDATES,
  existingExtraRoots,
  mergeSuggestedRoots,
  load,
  save,
  reset,
  filePath
};
