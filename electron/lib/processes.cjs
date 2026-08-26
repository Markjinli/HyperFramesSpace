const os = require('os');
const { execFile } = require('child_process');

function execPs(script, timeout) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { windowsHide: true, timeout: timeout || 12000, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(String(stdout || '').trim());
      }
    );
  });
}

function execQuiet(cmd, args, timeout) {
  return new Promise((resolve) => {
    execFile(cmd, args, { windowsHide: true, timeout: timeout || 4000 }, (err, stdout) => {
      if (err) return resolve('');
      resolve(String(stdout || '').trim());
    });
  });
}

function classify(cmd, name) {
  const lower = (String(cmd || '') + ' ' + String(name || '')).toLowerCase();
  if (/ffmpeg/.test(lower)) return 'encode';
  if (/snapshot/.test(lower)) return 'snapshot';
  if (/render/.test(lower) && /chrome|headless/.test(lower)) return 'render-chrome';
  if (/preview|hf-preview/.test(lower) && /chrome|msedge/.test(lower)) return 'studio-chrome';
  if (/preview/.test(lower)) return 'preview';
  if (/\bplay\b/.test(lower)) return 'play';
  if (/hyperframes/.test(lower)) return 'cli';
  if (/electron/.test(lower) && /framespace|hyperframesspace/i.test(lower)) return 'framespace';
  return 'other';
}

function projectFromCmd(cmd) {
  const s = String(cmd || '');
  const m = s.match(/(?:--project|--cwd|-d)\s+"?([A-Za-z]:\\[^"\s]+)/i)
    || s.match(/([A-Za-z]:\\Users\\[^"\s]+?)(?:\\index\.html|\\hyperframes\.json)?(?:\s|$)/i);
  if (!m) return '';
  const parts = m[1].split('\\').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function ageMin(iso) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (!t) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

function cpuSnapshot() {
  return os.cpus().reduce((acc, cpu) => {
    const t = cpu.times;
    acc.idle += t.idle;
    acc.total += t.user + t.nice + t.sys + t.idle + t.irq;
    return acc;
  }, { idle: 0, total: 0 });
}

let prevCpu = cpuSnapshot();

function sampleCpu() {
  const now = cpuSnapshot();
  const idle = now.idle - prevCpu.idle;
  const total = now.total - prevCpu.total;
  prevCpu = now;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idle / total) * 100)));
}

async function sampleGpu() {
  const raw = await execQuiet('nvidia-smi.exe', [
    '--query-gpu=utilization.gpu,memory.used,memory.total',
    '--format=csv,noheader,nounits'
  ], 3500);
  if (!raw) return { gpu: null, detail: '' };
  const first = raw.split(/\r?\n/)[0] || '';
  const parts = first.split(',').map((s) => Number(String(s).trim()));
  const util = Number.isFinite(parts[0]) ? Math.round(parts[0]) : null;
  return { gpu: util, detail: first };
}

async function listProcesses() {
  const script = [
    "$filter = \"Name='node.exe' OR Name='ffmpeg.exe' OR Name='chrome.exe' OR Name='msedge.exe' OR Name='electron.exe'\"",
    '$procs = Get-CimInstance Win32_Process -Filter $filter | Where-Object {',
    "  $_.CommandLine -and ($_.CommandLine -match 'hyperframes|hf-preview|headless|Framespace|HyperFramesSpace|3317')",
    '}',
    '$procs | Select-Object ProcessId, Name, CommandLine, WorkingSetSize, CreationDate | ConvertTo-Json -Compress'
  ].join('; ');
  let raw = '[]';
  try { raw = await execPs(script, 12000); } catch (_) { raw = '[]'; }
  let rows = [];
  try { rows = raw ? JSON.parse(raw) : []; } catch (_) { rows = []; }
  if (rows && !Array.isArray(rows)) rows = [rows];
  return (rows || []).map((row) => {
    const cmd = row.CommandLine || '';
    const kind = classify(cmd, row.Name);
    const memMb = Math.round((Number(row.WorkingSetSize) || 0) / 1048576);
    const age = ageMin(row.CreationDate);
    return {
      pid: Number(row.ProcessId),
      name: String(row.Name || '').replace(/\.exe$/i, ''),
      kind,
      project: projectFromCmd(cmd),
      cmd,
      port: null,
      ageMin: age,
      orphan: (kind === 'preview' || kind === 'play' || kind === 'studio-chrome') || (age >= 40 && kind !== 'encode' && kind !== 'render-chrome' && kind !== 'snapshot' && kind !== 'framespace'),
      cpu: 0,
      memMb,
      gpu: kind === 'render-chrome' || kind === 'studio-chrome' ? 8 : 0,
      paused: false
    };
  });
}

async function killPids(pids) {
  const list = (pids || []).map((n) => Number(n)).filter((n) => n > 0);
  const killed = [];
  for (const pid of list) {
    try {
      await execPs('Stop-Process -Id ' + pid + ' -Force -ErrorAction SilentlyContinue');
      killed.push(pid);
    } catch (_) {}
  }
  return { killed };
}

function hostResources() {
  return {
    ramMb: Math.round(os.totalmem() / 1048576),
    cpuThreads: os.cpus().length,
    name: os.hostname()
  };
}

function memPct() {
  const total = os.totalmem();
  if (!total) return 0;
  return Math.round(((total - os.freemem()) / total) * 100);
}

async function occupancy(procs) {
  const list = procs || [];
  const host = hostResources();
  const cpu = sampleCpu();
  const mem = memPct();
  let gpuInfo = { gpu: null };
  try { gpuInfo = await sampleGpu(); } catch (_) {}
  const hfMem = list.reduce((s, p) => s + (Number(p.memMb) || 0), 0);
  const rendering = list.some((p) => /encode|render-chrome|snapshot/.test(p.kind) && !p.paused);
  return {
    cpu,
    mem,
    gpu: gpuInfo.gpu == null ? 0 : gpuInfo.gpu,
    gpuKnown: gpuInfo.gpu != null,
    memMb: Math.round((os.totalmem() - os.freemem()) / 1048576),
    hfMemMb: hfMem,
    processCount: list.length,
    orphanCount: list.filter((p) => p.orphan).length,
    rendering,
    paused: list.some((p) => p.paused),
    host
  };
}

setTimeout(sampleCpu, 400);

module.exports = { listProcesses, killPids, hostResources, occupancy };