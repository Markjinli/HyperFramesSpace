const path = require('path');
const fs = require('fs');
const store = require('./store.cjs');
const scan = require('./scan.cjs');
const everything = require('./everything.cjs');
const drives = require('./drives.cjs');
const cache = require('./catalog-cache.cjs');

let active = null;

function sendEvent(send, type, payload) {
  if (typeof send === 'function') send(type, payload || {});
}

async function locateProjects(settings, signal, onProgress) {
  const enginePref = settings.scanEngine || 'auto';
  const scope = settings.scanScope || 'all-fixed';
  const probe = everything.probe();
  const wantEverything = enginePref === 'everything' || enginePref === 'auto' || enginePref === 'usn';

  if (wantEverything && probe.esPath) {
    onProgress({ phase: 'locate', engine: 'everything', percent: 8, current: 'Everything' });
    try {
      const dirs = await everything.queryHyperframes(probe.esPath);
      if (signal.aborted) return { engine: 'everything', dirs: [], everything: probe, aborted: true };
      if (dirs.length || enginePref === 'everything') {
        return { engine: 'everything', dirs, everything: probe, visited: dirs.length };
      }
    } catch (err) {
      if (enginePref === 'everything') {
        return { engine: 'everything', dirs: [], everything: Object.assign({}, probe, { error: err.message }), visited: 0 };
      }
    }
  }

  const roots = scope === 'roots'
    ? (settings.scanRoots || []).slice()
    : drives.listFixedDrives();
  const found = [];
  const seen = new Set();
  let visited = 0;
  for (const rootPath of roots) {
    if (signal.aborted) break;
    if (!rootPath || !fs.existsSync(rootPath)) continue;
    await scan.walkAsync(rootPath, settings.maxDepth == null ? 16 : settings.maxDepth, found, seen, {
      signal,
      onDir(dir) {
        visited += 1;
        if (visited === 1 || visited % 50 === 0) {
          onProgress({
            phase: 'locate',
            engine: 'walk',
            visited,
            found: found.length,
            current: dir,
            percent: Math.min(70, 10 + Math.round(Math.log10(visited + 1) * 18))
          });
        }
      }
    });
  }
  return { engine: 'walk', dirs: found, everything: probe, visited };
}

async function hydrate(dirs, latestPin, signal, onItem) {
  const projects = [];
  const sorted = dirs.slice().sort((a, b) => String(a).localeCompare(String(b), 'zh'));
  for (let i = 0; i < sorted.length; i++) {
    if (signal.aborted) break;
    let project;
    try {
      project = scan.readProject(sorted[i], latestPin);
    } catch (err) {
      project = {
        id: path.basename(sorted[i]),
        name: path.basename(sorted[i]),
        path: sorted[i],
        workflow: 'unknown',
        duration: 0,
        aspect: '—',
        pin: '',
        status: 'ready',
        collection: path.basename(path.dirname(sorted[i])),
        brief: '读取失败：' + err.message,
        frameSrcs: [],
        clips: [],
        files: [],
        findings: 0,
        tags: []
      };
    }
    projects.push(project);
    onItem(project, i + 1, sorted.length);
    if (i % 2 === 0) await new Promise((resolve) => setImmediate(resolve));
  }
  return projects;
}

async function run(userData, opts, send) {
  const settings = store.load(userData);
  const signal = opts.signal;
  const reason = (opts && opts.reason) || 'manual';
  const started = Date.now();
  sendEvent(send, 'scan:progress', { phase: 'start', reason, percent: 2, engine: settings.scanEngine || 'auto' });

  const loc = await locateProjects(settings, signal, (p) => sendEvent(send, 'scan:progress', p));
  if (signal.aborted) {
    sendEvent(send, 'scan:done', { cancelled: true, projects: null, engine: loc.engine, everything: loc.everything });
    return;
  }

  sendEvent(send, 'scan:progress', {
    phase: 'hydrate',
    engine: loc.engine,
    found: loc.dirs.length,
    percent: 74,
    current: ''
  });

  const projects = await hydrate(loc.dirs, settings.latestPin, signal, (project, index, total) => {
    sendEvent(send, 'scan:item', { project, index, total });
    sendEvent(send, 'scan:progress', {
      phase: 'hydrate',
      engine: loc.engine,
      found: total,
      index,
      total,
      percent: 74 + Math.round((index / Math.max(1, total)) * 24),
      current: project.path
    });
  });

  if (signal.aborted) {
    sendEvent(send, 'scan:done', { cancelled: true, projects, engine: loc.engine, everything: loc.everything });
    return;
  }

  cache.save(userData, { projects, engine: loc.engine, scope: settings.scanScope || 'all-fixed' });
  sendEvent(send, 'scan:done', {
    cancelled: false,
    projects,
    engine: loc.engine,
    scope: settings.scanScope || 'all-fixed',
    everything: loc.everything,
    visited: loc.visited || 0,
    elapsedMs: Date.now() - started,
    reason
  });
}

function start(userData, opts, send) {
  cancel();
  const ac = new AbortController();
  const job = { ac };
  active = job;
  run(userData, Object.assign({}, opts || {}, { signal: ac.signal }), send)
    .catch((err) => sendEvent(send, 'scan:error', { error: err.message || String(err) }))
    .finally(() => { if (active === job) active = null; });
  return { ok: true, running: true };
}

function cancel() {
  if (!active) return false;
  active.ac.abort();
  active = null;
  return true;
}

function isRunning() {
  return !!active;
}

module.exports = { start, cancel, isRunning };
