const { spawn } = require('child_process');
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

function startJob(spec) {
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

function openInTerminal(cwd, line, terminal) {
  const command = String(line || '');
  if (terminal === 'powershell') {
    spawn('powershell.exe', ['-NoExit', '-Command', 'Set-Location -LiteralPath "' + cwd + '"; ' + command], {
      detached: true, windowsHide: false, shell: false
    }).unref();
    return command;
  }
  const wt = spawn('wt.exe', ['-d', cwd, 'powershell', '-NoExit', '-Command', command], {
    detached: true, windowsHide: true, shell: false
  });
  wt.on('error', () => {
    spawn('cmd.exe', ['/k', 'cd /d "' + cwd + '" && ' + command], {
      detached: true, windowsHide: false, shell: false
    }).unref();
  });
  try { wt.unref(); } catch (_) {}
  return 'wt -d "' + cwd + '" ' + command;
}

function openAgent(agent, project, terminal) {
  if (!project || !project.path) throw new Error('project path required');
  const cwd = project.path;
  const a = String(agent || 'grok').toLowerCase();
  let line = 'grok --cwd "' + cwd + '"';
  if (a === 'codex') line = 'codex --cd "' + cwd + '"';
  else if (a === 'cursor') line = 'cursor "' + cwd + '"';
  else if (a === 'code' || a === 'vscode') line = 'code "' + cwd + '"';
  else if (a === 'claude') line = 'claude';
  if (a === 'cursor' || a === 'code' || a === 'vscode') {
    spawn(line, { cwd, shell: true, detached: true, windowsHide: true }).unref();
    return line;
  }
  return openInTerminal(cwd, line, terminal);
}

function home() { return os.homedir(); }

module.exports = {
  setListener, list, startJob, commandFor, openInTerminal, openAgent, home
};