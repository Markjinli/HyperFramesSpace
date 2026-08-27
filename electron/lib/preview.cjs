const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT_START = 3317;
const PORT_END = 3347;
let boundPort = 0;
const VENDOR = path.join(__dirname, '..', '..', 'vendor');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

let server = null;
let current = null;
let gen = 0;

function playerPage(project) {
  const name = String((project && project.name) || '').replace(/[<>]/g, '');
  const duration = Number(project && project.duration) || 0;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>${name}</title>
  <script src="/vendor/hyperframes-player.global.js"></script>
  <style>
    html, body { margin: 0; height: 100%; background: #07090d; color: #e8edf4; font-family: "Segoe UI", "Microsoft YaHei UI", sans-serif; overflow: hidden; }
    hyperframes-player { display: block; width: 100%; height: calc(100% - 58px); background: #000; }
    .dock {
      height: 58px; display: grid; grid-template-columns: 44px 1fr 108px;
      gap: 10px; align-items: center; padding: 0 12px;
      background: #10141b; border-top: 1px solid #2a3140;
    }
    button {
      width: 36px; height: 32px; border: 0; border-radius: 8px;
      background: #e8a317; color: #1a1203; font-weight: 700; cursor: pointer;
    }
    input[type=range] { width: 100%; accent-color: #e8a317; cursor: ew-resize; }
    .time { font: 12px/1 "Cascadia Mono", Consolas, monospace; color: #8d96a8; text-align: right; }
  </style>
</head>
<body>
  <hyperframes-player id="player" src="/p/index.html?g=${gen}" width="1920" height="1080" controls muted></hyperframes-player>
  <div class="dock">
    <button type="button" id="pp" title="播放/暂停">▶</button>
    <input id="seek" type="range" min="0" max="1000" value="0" step="1">
    <div class="time" id="time">0.0 / ${duration || '—'}</div>
  </div>
  <script>
    const player = document.getElementById('player');
    const seek = document.getElementById('seek');
    const time = document.getElementById('time');
    const pp = document.getElementById('pp');
    let dragging = false;
    const fallbackDur = ${duration || 0};
    function dur() { return player.duration > 0 ? player.duration : fallbackDur; }
    function fmt(n) { n = Number(n) || 0; return (Math.round(n * 10) / 10).toFixed(1); }
    function paint() {
      const d = dur();
      const t = player.currentTime || 0;
      if (!dragging && d > 0) seek.value = String(Math.round(t / d * 1000));
      time.textContent = fmt(t) + ' / ' + (d ? fmt(d) : '—');
      pp.textContent = player.paused ? '▶' : '❚❚';
    }
    function scrub(clientX) {
      const rect = seek.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const d = dur();
      if (!d) return;
      const t = ratio * d;
      seek.value = String(Math.round(ratio * 1000));
      player.currentTime = t;
      time.textContent = fmt(t) + ' / ' + fmt(d);
    }
    player.addEventListener('timeupdate', paint);
    player.addEventListener('loadedmetadata', paint);
    setInterval(paint, 500);
    pp.addEventListener('click', (e) => {
      e.stopPropagation();
      if (player.paused) player.play(); else player.pause();
      paint();
    });
    seek.addEventListener('pointerdown', (e) => {
      dragging = true;
      player.pause();
      seek.setPointerCapture(e.pointerId);
      scrub(e.clientX);
    });
    seek.addEventListener('pointermove', (e) => { if (dragging) scrub(e.clientX); });
    seek.addEventListener('input', () => {
      const d = dur();
      if (!d) return;
      player.currentTime = (Number(seek.value) / 1000) * d;
      paint();
    });
    window.addEventListener('pointerup', () => { dragging = false; });
  </script>
</body>
</html>`;
}

function safeJoin(root, rel) {
  const cleaned = String(rel || '').replace(/^\/+/, '').replace(/\\/g, '/');
  const full = path.normalize(path.join(root, cleaned));
  const base = path.normalize(root);
  if (full !== base && !full.startsWith(base + path.sep)) return null;
  return full;
}

function injectRuntime(html) {
  if (/hyperframe-runtime|\/runtime\.js/.test(html)) return html;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, '$&\n<script src="/runtime.js"><\/script>');
  return '<script src="/runtime.js"><\/script>\n' + html;
}

function sendFile(req, res, filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') {
    let html = fs.readFileSync(filePath, 'utf8');
    html = injectRuntime(html);
    const buf = Buffer.from(html, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': buf.length
    });
    res.end(buf);
    return;
  }
  const type = MIME[ext] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m) {
      const last = stat.size - 1;
      const start = m[1] === '' ? Math.max(0, stat.size - Number(m[2])) : Number(m[1]);
      const end = m[2] === '' ? last : Math.min(Number(m[2]), last);
      if (start <= end && start <= last) {
        res.writeHead(206, {
          'Content-Type': type,
          'Accept-Ranges': 'bytes',
          'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
          'Content-Length': String(end - start + 1),
          'Cache-Control': 'no-store'
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }
  }
  res.writeHead(200, {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Content-Length': String(stat.size),
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=60'
  });
  fs.createReadStream(filePath).pipe(res);
}

function handle(req, res) {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(playerPage(current || {}));
    return;
  }
  if (pathname === '/vendor/hyperframes-player.global.js') {
    sendFile(req, res, path.join(VENDOR, 'hyperframes-player.global.js'));
    return;
  }
  if (pathname === '/vendor/hyperframe-runtime.js' || pathname === '/runtime.js') {
    sendFile(req, res, path.join(VENDOR, 'hyperframe-runtime.js'));
    return;
  }
  if (pathname.startsWith('/p/')) {
    if (!current || !current.path) {
      res.writeHead(409);
      res.end('no project');
      return;
    }
    const rel = pathname.slice(3) || 'index.html';
    const file = safeJoin(current.path, rel);
    sendFile(req, res, file);
    return;
  }
  res.writeHead(404);
  res.end('not found');
}

function listenOn(port) {
  return new Promise((resolve, reject) => {
    const s = http.createServer(handle);
    const onErr = (err) => {
      s.off('listening', onOk);
      try { s.close(); } catch (_) {}
      reject(err);
    };
    const onOk = () => {
      s.off('error', onErr);
      server = s;
      boundPort = port;
      resolve(port);
    };
    s.once('error', onErr);
    s.once('listening', onOk);
    s.listen(port, '127.0.0.1');
  });
}

async function listen() {
  if (server && boundPort) return boundPort;
  let lastErr = null;
  for (let port = PORT_START; port <= PORT_END; port++) {
    try {
      return await listenOn(port);
    } catch (err) {
      lastErr = err;
      if (!err || err.code !== 'EADDRINUSE') throw err;
    }
  }
  throw lastErr || new Error('没有可用的预览端口');
}

async function ensure(project) {
  if (!project || !project.path) throw new Error('project path required');
  const port = await listen();
  gen += 1;
  current = {
    path: project.path,
    name: project.name || '',
    duration: Number(project.duration) || 0,
    pin: project.pin || '',
    port,
    gen
  };
  current.url = 'http://127.0.0.1:' + port + '/?v=' + gen;
  return Object.assign({ reused: gen > 1, running: true }, current);
}

async function stop() {
  current = null;
  gen += 1;
  return { ok: true, running: false };
}

function status() {
  return current ? Object.assign({ running: true }, current) : { running: false };
}

async function restart(project) {
  shutdown();
  boundPort = 0;
  server = null;
  return ensure(project || {});
}

function shutdown() {
  current = null;
  if (server) {
    try { server.close(); } catch (_) {}
    server = null;
  }
}

module.exports = { ensure, restart, stop, status, shutdown, PORT: PORT_START };