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
  cardSize: 'm',
  scanIntervalSec: 0,
  autoSnapshot: false,
  catalogUrl: 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/catalog.json',
  customCollections: null,
  pinnedFolders: [],
  latestPin: ''
};

function filePath(userData) {
  return path.join(userData, 'settings.json');
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

module.exports = { DEFAULTS, load, save, filePath };