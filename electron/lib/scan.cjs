const fs = require('fs');
const path = require('path');

const SKIP_DIR = new Set([
  'node_modules', '.git', '.hg', '.svn', '.cache', '.npm', '.yarn', '.pnpm-store',
  '.codex', '.cursor', '.vscode', '.idea', '.agents', '.next', '.turbo',
  'appdata', 'application data', 'local settings', 'intel', 'nvidia',
  'windows', '$recycle.bin', 'system volume information', 'cookies',
  'recent', 'sendto', 'start menu', 'templates', 'ntuser.dat',
  'contacts', 'favorites', 'searches', 'saved games', 'links',
  '.hyperframes', '.media', 'dist', 'build', 'out', 'coverage',
  'program files', 'program files (x86)', 'programdata', 'windows.old',
  'recovery', 'msocache', 'perflogs', 'config.msi', '$windows.~bt', '$windows.~ws'
]);

function mediaUrl(filePath) {
  if (!filePath) return null;
  return 'framespace://media/?p=' + encodeURIComponent(filePath);
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (_) { return ''; }
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
}

function parseFrontMatter(text) {
  const out = {};
  const m = String(text || '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return out;
  m[1].split(/\r?\n/).forEach((line) => {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) return;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[kv[1]] = v;
  });
  return out;
}

function parseDuration(raw) {
  if (raw == null || raw === '') return 0;
  const n = Number(String(raw).replace(/s$/i, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function parsePin(pkg) {
  if (!pkg) return '';
  const blob = JSON.stringify(pkg.scripts || pkg);
  const m = blob.match(/hyperframes@([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.]+)?)/);
  return m ? m[1] : '';
}

function parseRootAttrs(html) {
  const out = { duration: 0, width: 0, height: 0, fps: 0, id: '' };
  if (!html) return out;
  const root = html.match(/<(?:div|section)[^>]*(?:data-composition-id|data-duration)[^>]*>/i);
  const tag = root ? root[0] : html.slice(0, 4000);
  const grab = (name) => {
    const m = tag.match(new RegExp(name + '=["\']([^"\']+)'));
    return m ? m[1] : '';
  };
  out.id = grab('data-composition-id');
  out.duration = parseDuration(grab('data-duration'));
  out.width = Number(grab('data-width')) || 0;
  out.height = Number(grab('data-height')) || 0;
  out.fps = Number(grab('data-fps')) || 0;
  return out;
}

function parseClips(html) {
  const clips = [];
  if (!html) return clips;
  const re = /<([a-z0-9]+)([^>]*\bclass=["'][^"']*\bclip\b[^"']*["'][^>]*)>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[2];
    const get = (name) => {
      const hit = attrs.match(new RegExp(name + '=["\']([^"\']+)'));
      return hit ? hit[1] : '';
    };
    const id = get('id') || get('data-composition-id') || ('clip-' + (clips.length + 1));
    clips.push({
      id,
      label: id,
      start: parseDuration(get('data-start')),
      dur: parseDuration(get('data-duration')),
      track: Number(get('data-track-index')) || 1
    });
    if (clips.length >= 48) break;
  }
  return clips;
}

function inferCollection(dir) {
  const lower = dir.toLowerCase();
  if (lower.includes('转转')) return '转转笔记本';
  if (lower.includes('hx370') || lower.includes('claw') || lower.includes('g3e') || lower.includes('掌机')) return '掌机芯片';
  if (lower.includes('font') || lower.includes('type') || lower.includes('canvas')) return '字体实验';
  const parent = path.basename(path.dirname(dir));
  if (parent && parent !== 'Users' && parent !== 'Documents' && parent !== 'Videos') return parent;
  return '未分组';
}

function listTopFiles(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.name !== 'node_modules' && d.name !== '.git')
      .slice(0, 40)
      .map((d) => d.isDirectory() ? d.name + '/' : d.name);
  } catch (_) {
    return [];
  }
}

function collectImages(dir, acc, depth) {
  if (!dir || depth < 0 || acc.length >= 24) return;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  ents.forEach((ent) => {
    if (acc.length >= 24) return;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR.has(ent.name.toLowerCase())) return;
      collectImages(full, acc, depth - 1);
      return;
    }
    if (/\.(png|jpe?g|webp|gif)$/i.test(ent.name) && !/finding-/i.test(ent.name)) {
      acc.push(full);
    }
  });
}

function coverSources(dir) {
  const acc = [];
  const shots = path.join(dir, 'snapshots');
  const thumbs = path.join(dir, '.thumbnails');
  const assets = path.join(dir, 'assets');
  collectImages(shots, acc, 2);
  if (acc.length < 3) collectImages(thumbs, acc, 1);
  if (acc.length < 3) collectImages(path.join(assets, 'thumbs'), acc, 2);
  if (acc.length < 3) collectImages(assets, acc, 1);
  return acc.slice(0, 12);
}

function countFindings(dir) {
  const shots = path.join(dir, 'snapshots');
  let n = 0;
  try {
    fs.readdirSync(shots).forEach((name) => {
      if (/finding-/i.test(name)) n += 1;
    });
  } catch (_) {}
  return n;
}

function hasRender(dir) {
  const names = ['renders', 'out', 'output'];
  for (const name of names) {
    const folder = path.join(dir, name);
    try {
      const hit = fs.readdirSync(folder).some((f) => /\.(mp4|webm|mov)$/i.test(f));
      if (hit) return true;
    } catch (_) {}
  }
  try {
    return fs.readdirSync(dir).some((f) => /\.(mp4|webm|mov)$/i.test(f));
  } catch (_) {
    return false;
  }
}

function shouldSkipDir(name) {
  const lower = name.toLowerCase();
  if (SKIP_DIR.has(lower)) return true;
  if (lower.startsWith('ntuser')) return true;
  return false;
}

function walk(root, maxDepth, found, seen) {
  if (!root || maxDepth < 0) return;
  let ents;
  try { ents = fs.readdirSync(root, { withFileTypes: true }); } catch (_) { return; }
  const hasMarker = ents.some((ent) => !ent.isDirectory() && String(ent.name).toLowerCase() === 'hyperframes.json');
  if (hasMarker) {
    const key = path.normalize(root).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      found.push(root);
    }
    return;
  }
  ents.forEach((ent) => {
    if (!ent.isDirectory()) return;
    if (shouldSkipDir(ent.name)) return;
    walk(path.join(root, ent.name), maxDepth - 1, found, seen);
  });
}

async function walkAsync(root, maxDepth, found, seen, opts) {
  opts = opts || {};
  const signal = opts.signal;
  const onDir = opts.onDir;
  const queue = [{ dir: root, depth: maxDepth }];
  let steps = 0;
  while (queue.length) {
    if (signal && signal.aborted) return;
    const item = queue.shift();
    if (!item || item.depth < 0) continue;
    let ents;
    try { ents = await fs.promises.readdir(item.dir, { withFileTypes: true }); } catch (_) { continue; }
    if (typeof onDir === 'function') onDir(item.dir);
    const hasMarker = ents.some((ent) => !ent.isDirectory() && String(ent.name).toLowerCase() === 'hyperframes.json');
    if (hasMarker) {
      const key = path.normalize(item.dir).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        found.push(item.dir);
      }
      continue;
    }
    ents.forEach((ent) => {
      if (!ent.isDirectory()) return;
      if (shouldSkipDir(ent.name)) return;
      queue.push({ dir: path.join(item.dir, ent.name), depth: item.depth - 1 });
    });
    steps += 1;
    if (steps % 24 === 0) await new Promise((resolve) => setImmediate(resolve));
  }
}

function readProject(dir, latestPin) {
  const hf = readJson(path.join(dir, 'hyperframes.json')) || {};
  const pkg = readJson(path.join(dir, 'package.json')) || {};
  const meta = readJson(path.join(dir, 'meta.json')) || {};
  const briefText = readText(path.join(dir, 'BRIEF.md'));
  const brief = parseFrontMatter(briefText);
  const html = readText(path.join(dir, 'index.html'));
  const root = parseRootAttrs(html);
  const clips = parseClips(html);
  const pin = parsePin(pkg);
  const findings = countFindings(dir);
  const rendered = hasRender(dir);
  let status = 'ready';
  if (findings > 0) status = 'findings';
  else if (rendered) status = 'rendered';
  else if (latestPin && pin && pin !== latestPin && comparePin(pin, latestPin) < 0) status = 'stale-pin';

  const duration = parseDuration(brief.length) || root.duration || 0;
  const width = Number(String(brief.aspect || '').split(/[x×]/i)[0]) || root.width || 1920;
  const height = Number(String(brief.aspect || '').split(/[x×]/i)[1]) || root.height || 1080;
  const frames = coverSources(dir);
  const id = String(meta.id || pkg.name || path.basename(dir)).replace(/\s+/g, '-');
  const message = brief.message || '';
  const firstLine = (briefText.split(/\r?\n/).find((l) => l && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('---')) || '').trim();

  return {
    id,
    name: meta.name || pkg.name || path.basename(dir),
    path: dir,
    workflow: brief.workflow || hf.authoringSkill || 'general-video',
    flow: brief.flow || '',
    duration,
    aspect: width + '×' + height,
    fps: root.fps || 30,
    pin: pin || 'unpinned',
    status,
    collection: inferCollection(dir),
    language: brief.language || '',
    destination: brief.destination || '',
    narration: /^(yes|true|1)$/i.test(String(brief.narration || '')),
    brief: message || firstLine || '尚未写 BRIEF 一句话。',
    thumb: frames[0] ? mediaUrl(frames[0]) : null,
    frameSrcs: frames.map(mediaUrl),
    createdAt: meta.createdAt || '',
    compositions: 1,
    tracks: clips.reduce((max, c) => Math.max(max, c.track || 1), 1),
    hasStoryboard: fs.existsSync(path.join(dir, 'STORYBOARD.md')),
    hasScript: fs.existsSync(path.join(dir, 'SCRIPT.md')),
    findings,
    tags: [brief.workflow, brief.destination, brief.angle].filter(Boolean),
    clips,
    files: listTopFiles(dir),
    authoringSkill: hf.authoringSkill || brief.workflow || ''
  };
}

function comparePin(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
  }
  return 0;
}

function scanRoots(roots, opts) {
  opts = opts || {};
  const maxDepth = opts.maxDepth == null ? 6 : opts.maxDepth;
  const latestPin = opts.latestPin || '';
  const found = [];
  const seen = new Set();
  (roots || []).forEach((root) => {
    if (!root || !fs.existsSync(root)) return;
    const stat = fs.statSync(root);
    if (stat.isFile() && path.basename(root) === 'hyperframes.json') {
      found.push(path.dirname(root));
      return;
    }
    if (stat.isDirectory()) walk(root, maxDepth, found, seen);
  });
  found.sort((a, b) => a.localeCompare(b, 'zh'));
  return found.map((dir) => {
    try { return readProject(dir, latestPin); }
    catch (err) {
      return {
        id: path.basename(dir),
        name: path.basename(dir),
        path: dir,
        workflow: 'unknown',
        duration: 0,
        aspect: '—',
        pin: '',
        status: 'ready',
        collection: inferCollection(dir),
        brief: '读取失败：' + err.message,
        frameSrcs: [],
        clips: [],
        files: [],
        findings: 0,
        tags: []
      };
    }
  });
}

module.exports = {
  scanRoots,
  readProject,
  parseFrontMatter,
  parsePin,
  parseClips,
  mediaUrl,
  comparePin,
  walkAsync,
  shouldSkipDir
};