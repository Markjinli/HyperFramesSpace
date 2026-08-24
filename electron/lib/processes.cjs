const os = require('os');
const { execFile } = require('child_process');

function execPs(script, timeout) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { windowsHide: true, timeout: timeout || 20000, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(String(stdout || '').trim());
      }
    );
  });
}

function classify(cmd, name) {
  const s = String(cmd || '') + ' ' + String(name || '');
  const lower = s.toLowerCase();
  if (/ffmpeg/.test(lower)) return 'encode';
  if (/snapshot/.test(lower)) return 'snapshot';
  if (/render/.test(lower) && /chrome|headless/.test(lower)) return 'render-chrome';
  if (/preview|hf-preview/.test(lower) && /chrome|msedge/.test(lower)) return 'studio-chrome';
  if (/preview/.test(lower)) return 'preview';
  if (/\bplay\b/.test(lower)) return 'play';
  if (/hyperframes/.test(lower)) return 'cli';
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

async function listProcesses() {
  const script = [
    "$procs = Get-CimInstance Win32_Process | Where-Object {",
    "  $_.Name -match 'node|ffmpeg|chrome|msedge' -and",
    "  $_.CommandLine -and",
    "  $_.CommandLine -match 'hyperframes|hf-preview|headless'",
    "}",
    "$procs | Select-Object ProcessId, Name, CommandLine, WorkingSetSize, CreationDate | ConvertTo-Json -Compress"
  ].join('; ');
  let raw = '[]';
  try { raw = await execPs(script, 25000); } catch (_) { raw = '[]'; }
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
      orphan: age >= 40 && kind !== 'encode' && kind !== 'render-chrome' && kind !== 'snapshot',
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

function occupancy(procs) {
  const list = procs || [];
  const memMb = list.reduce((s, p) => s + (Number(p.memMb) || 0), 0);
  const host = hostResources();
  const memPct = host.ramMb ? Math.round((memMb / host.ramMb) * 100) : 0;
  const rendering = list.some((p) => /encode|render-chrome|snapshot/.test(p.kind) && !p.paused);
  return {
    cpu: Math.min(99, list.length * 6),
    mem: Math.min(99, memPct),
    gpu: Math.min(99, list.reduce((s, p) => s + (Number(p.gpu) || 0), 0)),
    rendering,
    paused: list.some((p) => p.paused)
  };
}

module.exports = { listProcesses, killPids, hostResources, occupancy };