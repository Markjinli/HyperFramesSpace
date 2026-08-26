const { spawn } = require('child_process');
const fs = require('fs');
const agents = require('./agents.cjs');
const processes = require('./processes.cjs');
const path = require('path');
const os = require('os');

const jobs = [];
let seq = 1;
let onChange = () => {};

function setListener(fn) { onChange = typeof fn === 'function' ? fn : () => {}; }
function list() { return jobs.slice(); }
function emit() { onChange(list()); }

function pinCmd(project, rest) {
  const pin = project && project.pin && project.pin !== 'unpinned' ? '@' + project.pin : '';
  return 'npx --yes hyperframes' + pin + ' ' + rest;
}

function commandFor(action, project, extra) {
  extra = extra || {};
  const dir = project && project.path ? project.path : extra.cwd || process.cwd();
  const quoted = '"' + dir + '"';
  switch (String(action)) {
    case 'preview': return pinCmd(project, 'preview ' + quoted);
    case 'play': return pinCmd(project, 'play ' + quoted);
    case 'lint': return pinCmd(project, 'lint ' + quoted);
    case 'check': return pinCmd(project, 'check ' + quoted);
    case 'snapshot': return pinCmd(project, 'snapshot ' + quoted);
    case 'snapshot-9': return pinCmd(project, 'snapshot ' + quoted + ' --frames 9');
    case 'render': return pinCmd(project, 'render ' + quoted + ' --quality high --output out.mp4');
    case 'render-draft': return pinCmd(project, 'render ' + quoted + ' --quality draft');
    case 'doctor': return 'npx --yes hyperframes doctor --json';
    case 'init': return 'npx --yes hyperframes init ' + (extra.name || 'my-video') + ' --non-interactive --example blank';
    case 'compositions': return pinCmd(project, 'compositions ' + quoted + ' --json');
    case 'upgrade': return 'npx --yes hyperframes@latest upgrade --project ' + quoted + ' --check';
    case 'info': return pinCmd(project, 'info ' + quoted + ' --json');
    case 'capture': return 'npx --yes hyperframes capture ' + (extra.url || 'https://example.com') + ' -o ' + quoted;
    default: return extra.command || '';
  }
}

async function killPreviewLeftovers() {
  try {
    const list = await processes.listProcesses();
    const pids = list.filter((p) => p.kind === 'preview' || p.kind === 'play' || p.kind === 'studio-chrome').map((p) => p.pid);
    if (pids.length) await processes.killPids(pids);
  } catch (_) {}
}

async function startJob(spec) {
  spec = spec || {};
  const project = spec.project || null;
  const action = spec.action || 'cli';
  const cwd = spec.cwd || (project && project.path) || process.cwd();
  const command = spec.command || commandFor(action, project, spec);
  const detached = !!spec.detached || action === 'preview' || action === 'play';
  const id = 'job-' + (seq++);
  const job = {
    id,
    action,
    title: spec.title || ((project && project.name) || path.basename(cwd)) + ' · ' + action,
    command,
    cwd,
    status: 'running',
    progress: detached ? 100 : 8,
    log: '',
    startedAt: Date.now(),
    pid: 0
  };
  jobs.unshift(job);
  if (jobs.length > 40) jobs.pop();

  if (detached) {
    await killPreviewLeftovers();
  }

  const child = spawn(command, {
    cwd,
    shell: true,
    windowsHide: !detached,
    detached,
    env: Object.assign({}, process.env)
  });
  job.pid = child.pid || 0;
  const take = (buf) => {
    job.log = (job.log + String(buf || '')).slice(-12000);
    if (job.progress < 90 && !detached) job.progress += 4;
    emit();
  };
  if (child.stdout) child.stdout.on('data', take);
  if (child.stderr) child.stderr.on('data', take);
  child.on('error', (err) => {
    job.status = 'error';
    job.progress = 100;
    job.log += '\n' + err.message;
    emit();
  });
  child.on('close', (code) => {
    if (detached) {
      job.status = 'running';
      job.progress = 100;
      job.log += '\n已在后台打开。';
    } else {
      job.status = code === 0 ? 'done' : 'error';
      job.progress = 100;
      job.log += '\nexit ' + code;
    }
    emit();
  });
  if (detached) {
    try { child.unref(); } catch (_) {}
  }
  emit();
  return job;
}

function extraPath() {
  const home = os.homedir();
  return [
    path.join(home, '.grok', 'bin'),
    path.join(home, 'AppData', 'Roaming', 'npm'),
    path.join(home, 'AppData', 'Local', 'OpenAI', 'Codex', 'bin'),
    'C:\\Program Files\\nodejs',
    process.env.PATH || ''
  ].join(';');
}

function firstExisting(list) {
  for (const item of list) {
    if (item && fs.existsSync(item)) return item;
  }
  return '';
}

function resolveAgentBin(agent) {
  const home = os.homedir();
  const a = String(agent || 'grok').toLowerCase();
  if (a === 'grok' || a === 'grok-build' || a === 'grokbuild') {
    return firstExisting([
      path.join(home, '.grok', 'bin', 'grok.exe'),
      path.join(home, '.grok', 'bin', 'grok.cmd')
    ]) || 'grok';
  }
  if (a === 'codex') {
    return firstExisting([
      path.join(home, 'AppData', 'Roaming', 'npm', 'codex.cmd'),
      path.join(home, 'AppData', 'Local', 'OpenAI', 'Codex', 'bin', 'codex.exe')
    ]) || 'codex';
  }
  if (a === 'cursor') return 'cursor';
  if (a === 'code' || a === 'vscode' || a === 'vs-code') return 'code';
  if (a === 'claude' || a === 'claude-code') return 'claude';
  return a;
}

function openVisible(cwd, exe, args) {
  const env = Object.assign({}, process.env, { PATH: extraPath() });
  const parts = [exe].concat(args || []).map((part) => {
    const s = String(part);
    return /[\s&()^<>|"']/.test(s) || /[^\x00-\x7F]/.test(s) ? '"' + s.replace(/"/g, '\\"') + '"' : s;
  });
  const inner = parts.join(' ');
  spawn('cmd.exe', ['/c', 'start', 'HyperFramesSpace', '/D', cwd, 'cmd.exe', '/k', inner], {
    detached: true,
    windowsHide: true,
    env
  }).unref();
  return 'start /D "' + cwd + '" ' + inner;
}

function openInTerminal(cwd, line, terminal) {
  return openVisible(cwd, 'cmd.exe', ['/k', line]);
}

function openAgent(agent, project, terminal) {
  const res = agents.openAgent(agent, project);
  return (res && res.command) || '';
}

function home() { return os.homedir(); }

module.exports = {
  setListener, list, startJob, commandFor, openInTerminal, openAgent, home
};