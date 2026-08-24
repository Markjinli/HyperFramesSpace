const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function run(cmd, args, timeout) {
  return new Promise((resolve) => {
    execFile(cmd, args, { windowsHide: true, timeout: timeout || 12000 }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        text: String(stdout || stderr || (err && err.message) || '').trim()
      });
    });
  });
}

function which(name) {
  return run('where.exe', [name], 8000);
}

async function inspect(projects) {
  const node = await run(process.execPath, ['-v'], 5000);
  const ffmpeg = await which('ffmpeg');
  const ffprobe = await which('ffprobe');
  const npx = await which('npx');
  let cli = { ok: false, text: '' };
  if (npx.ok) {
    cli = await run('npx.cmd', ['--yes', 'hyperframes@latest', '--version'], 45000);
  }
  const pins = {};
  (projects || []).forEach((p) => {
    const pin = p.pin || 'unpinned';
    pins[pin] = (pins[pin] || 0) + 1;
  });
  const latest = (cli.text.match(/(\d+\.\d+\.\d+)/) || [])[1] || '';
  const stale = (projects || []).filter((p) => p.status === 'stale-pin' || (latest && p.pin && p.pin !== latest && p.pin !== 'unpinned')).length;
  const disks = os.cpus().length + ' 线程 · ' + Math.round(os.totalmem() / 1073741824) + ' GB 内存';
  return {
    latestPin: latest,
    cards: [
      { title: 'Node.js', ok: /^v(2[2-9]|[3-9])/.test(node.text), detail: node.text || '未找到' },
      { title: 'HyperFrames CLI', ok: cli.ok, detail: latest ? ('latest ' + latest) : (cli.text.slice(0, 80) || 'npx 不可用') },
      { title: 'FFmpeg / FFprobe', ok: ffmpeg.ok && ffprobe.ok, detail: ffmpeg.ok ? '已找到' : '未找到 ffmpeg' },
      { title: 'npx', ok: npx.ok, detail: npx.ok ? '可用' : '需要 Node.js / npm' },
      { title: '工程 pin 漂移', ok: stale === 0, warn: stale > 0, detail: stale ? (stale + ' 个落后') : '与 latest 对齐' },
      { title: '本机', ok: true, detail: disks }
    ]
  };
}

function exists(p) { try { return fs.existsSync(p); } catch (_) { return false; } }

function scanSkillDir(root, source) {
  const out = [];
  if (!exists(root)) return out;
  let ents = [];
  try { ents = fs.readdirSync(root, { withFileTypes: true }); } catch (_) { return out; }
  ents.forEach((ent) => {
    if (!ent.isDirectory()) return;
    const dir = path.join(root, ent.name);
    const skillMd = path.join(dir, 'SKILL.md');
    const nested = path.join(dir, 'SKILL.md');
    let file = exists(skillMd) ? skillMd : '';
    if (!file) {
      try {
        const kids = fs.readdirSync(dir, { withFileTypes: true });
        const hit = kids.find((k) => k.isDirectory() && exists(path.join(dir, k.name, 'SKILL.md')));
        if (hit) file = path.join(dir, hit.name, 'SKILL.md');
      } catch (_) {}
    }
    if (!file && exists(nested)) file = nested;
    if (!file) return;
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch (_) {}
    const name = (text.match(/^name:\s*(.+)$/m) || [])[1] || ent.name;
    const summary = (text.match(/^description:\s*>?\s*(.+)$/m) || [])[1] || '';
    out.push({
      id: name.trim() || ent.name,
      name: name.trim() || ent.name,
      source,
      version: 'local',
      path: path.dirname(file),
      repo: '',
      summary: String(summary).replace(/\s+/g, ' ').slice(0, 80),
      rating: 0,
      note: ''
    });
  });
  return out;
}

async function listSkills() {
  const home = os.homedir();
  const dirs = [
    [path.join(home, '.agents', 'skills'), 'agents'],
    [path.join(home, '.codex', 'skills'), 'codex'],
    [path.join(home, '.grok', 'skills'), 'grok']
  ];
  const seen = new Set();
  const out = [];
  dirs.forEach(([dir, source]) => {
    scanSkillDir(dir, source).forEach((s) => {
      if (seen.has(s.id)) return;
      seen.add(s.id);
      out.push(s);
    });
  });
  out.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  return out;
}

async function fetchCatalog(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.json();
}

module.exports = { inspect, listSkills, fetchCatalog };