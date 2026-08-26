const fs = require('fs');
const path = require('path');

function cachePath(userData) {
  return path.join(userData, 'catalog-cache.json');
}

function load(userData) {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath(userData), 'utf8'));
    if (!raw || !Array.isArray(raw.projects)) return null;
    return raw;
  } catch (_) {
    return null;
  }
}

function save(userData, payload) {
  payload = payload || {};
  fs.mkdirSync(userData, { recursive: true });
  const body = {
    savedAt: Date.now(),
    engine: payload.engine || '',
    scope: payload.scope || '',
    projects: payload.projects || []
  };
  fs.writeFileSync(cachePath(userData), JSON.stringify(body), 'utf8');
  return body;
}

function clear(userData) {
  try { fs.unlinkSync(cachePath(userData)); } catch (_) {}
}

module.exports = { load, save, clear, cachePath };
