const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function exists(p) {
  try { return !!(p && fs.existsSync(p)); } catch (_) { return false; }
}

function q(s) {
  return '"' + String(s).replace(/"/g, '""') + '"';
}

function home() { return os.homedir(); }

function userEnv() {
  const extras = [
    path.join(home(), '.grok', 'bin'),
    path.join(home(), 'AppData', 'Roaming', 'npm'),
    path.join(home(), 'AppData', 'Local', 'Programs', 'cursor', 'resources', 'app', 'bin'),
    path.join(home(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links'),
    'C:\\Program Files\\nodejs',
    process.env.PATH || ''
  ];
  return Object.assign({}, process.env, { PATH: extras.join(';') });
}

function detach(command, args, opts) {
  const child = spawn(command, args, Object.assign({
    detached: true,
    stdio: 'ignore',
    windowsVerbatimArguments: false,
    env: userEnv()
  }, opts || {}));
  child.on('error', () => {});
  try { child.unref(); } catch (_) {}
  return child;
}

function startConsole(title, cwd, exe, args) {
  const parts = ['start', q(title), '/D', q(cwd), q(exe)].concat(args || []);
  const line = parts.join(' ');
  detach(process.env.ComSpec || 'cmd.exe', ['/c', line], {
    windowsHide: true,
    cwd,
    windowsVerbatimArguments: true
  });
  return line;
}

function resolveGrok() {
  return [
    path.join(home(), '.grok', 'bin', 'grok.exe')
  ].find(exists) || '';
}

function resolveCodexJs() {
  return [
    path.join(home(), 'AppData', 'Roaming', 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js'),
    path.join(home(), 'AppData', 'Roaming', 'npm', 'codex.cmd')
  ].find(exists) || '';
}

function resolveNode() {
  return [
    'C:\\Program Files\\nodejs\\node.exe',
    path.join(home(), 'AppData', 'Local', 'Programs', 'node', 'node.exe')
  ].find(exists) || 'node';
}

function resolveCursor() {
  return [
    path.join(home(), 'AppData', 'Local', 'Programs', 'cursor', 'Cursor.exe'),
    path.join(home(), 'AppData', 'Local', 'Programs', 'cursor', 'resources', 'app', 'bin', 'cursor.cmd')
  ].find(exists) || '';
}

function resolveClaude() {
  return [
    path.join(home(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links', 'claude.exe'),
    path.join(home(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages', 'Anthropic.ClaudeCode_Microsoft.Winget.Source_8wekyb3d8bbwe', 'claude.exe')
  ].find(exists) || '';
}

function resolveChatGptApp() {
  return 'shell:AppsFolder\\OpenAI.Codex_2p2nqsd0c76g0!App';
}

function startShellUrl(url) {
  detach(process.env.ComSpec || 'cmd.exe', ['/c', 'start', '', url], {
    windowsHide: true,
    windowsVerbatimArguments: true
  });
  return 'start "" ' + q(url);
}

function openChatGptDesktop(cwd) {
  const commands = [];
  commands.push(startShellUrl('codex:'));
  commands.push(startShellUrl(resolveChatGptApp()));
  const bin = resolveCodexJs();
  const node = resolveNode();
  if (exists(node) && exists(bin) && bin.endsWith('.js')) {
    detach(node, [bin, 'app', cwd], { cwd, windowsHide: true, stdio: 'ignore' });
    commands.push(q(node) + ' ' + q(bin) + ' app ' + q(cwd));
  }
  return { ok: true, command: commands.join(' && ') };
}
function openAgent(agent, project) {
  if (!project || !project.path) throw new Error('Select a project first / 先选一个工程');
  const cwd = String(project.path);
  if (!exists(cwd)) throw new Error('Project folder missing / 工程目录不存在：' + cwd);
  const a = String(agent || '').toLowerCase().replace(/\s+/g, '-');

  if (a === 'cursor') {
    const exe = resolveCursor();
    if (!exe) throw new Error('Cursor.exe not found / 找不到 Cursor.exe');
    detach(exe, [cwd], { cwd, windowsHide: false });
    return { ok: true, command: q(exe) + ' ' + q(cwd) };
  }

  if (a === 'codex' || a === 'codex-cli') {
    const bin = resolveCodexJs();
    const node = resolveNode();
    if (!bin) throw new Error('Codex CLI not found / 找不到 Codex CLI');
    if (bin.endsWith('.js')) {
      const command = startConsole('Codex CLI', cwd, node, [bin, '--cd', cwd]);
      return { ok: true, command };
    }
    const command = startConsole('Codex CLI', cwd, bin, ['--cd', cwd]);
    return { ok: true, command };
  }

  if (a === 'grok' || a === 'grok-build' || a === 'grokbuild') {
    const exe = resolveGrok();
    if (!exe) throw new Error('Grok Build not found / 找不到 Grok Build：' + path.join(home(), '.grok', 'bin', 'grok.exe'));
    const command = startConsole('Grok Build', cwd, exe, ['--cwd', q(cwd), '--fullscreen']);
    return { ok: true, command };
  }

  if (a === 'chatgpt-app' || a === 'chatgpt-desktop' || a === 'chatgpt') {
    return openChatGptDesktop(cwd);
  }

  if (a === 'claude' || a === 'claude-code' || a === 'claudecode') {
    const exe = resolveClaude();
    if (!exe) throw new Error('Claude Code not found / 找不到 Claude Code（claude.exe）');
    const command = startConsole('Claude Code', cwd, exe, []);
    return { ok: true, command };
  }

  if (a === 'code' || a === 'vscode' || a === 'vs-code') {
    detach(process.env.ComSpec || 'cmd.exe', ['/c', 'code', cwd], { cwd, windowsHide: true });
    return { ok: true, command: 'code ' + q(cwd) };
  }

  throw new Error('Unknown agent / 未知 agent：' + agent);
}

function diagnose() {
  return {
    grok: resolveGrok(),
    codex: resolveCodexJs(),
    node: resolveNode(),
    cursor: resolveCursor(),
    claude: resolveClaude(),
    chatgptApp: resolveChatGptApp()
  };
}

module.exports = { openAgent, diagnose, resolveGrok, resolveCursor, resolveCodexJs, resolveClaude };