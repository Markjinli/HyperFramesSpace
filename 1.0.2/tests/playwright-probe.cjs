'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCRATCH = process.env.FRAMESPACE_SCRATCH ||
  'C:\\Users\\M\\AppData\\Local\\Temp\\grok-goal-f86da6ce8437\\implementer';
const logLines = [];
function log(msg) {
  logLines.push(String(msg));
  console.log(msg);
}
function flush(ok) {
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(path.join(SCRATCH, 'playwright.log'), logLines.join('\n') + '\n');
  if (!ok) process.exit(1);
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/plain; charset=utf-8'
};

function startServer() {
  return new Promise(function (resolve, reject) {
    const server = http.createServer(function (req, res) {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = urlPath === '/' ? '/index.html' : urlPath;
      const file = path.normalize(path.join(ROOT, rel));
      if (file.indexOf(ROOT) !== 0) {
        res.writeHead(403); res.end('forbidden'); return;
      }
      fs.readFile(file, function (err, data) {
        if (err) { res.writeHead(404); res.end('not found ' + rel); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', function () {
      resolve({ server: server, url: 'http://127.0.0.1:' + server.address().port + '/index.html' });
    });
    server.on('error', reject);
  });
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] && fs.existsSync(candidates[i])) return candidates[i];
  }
  return null;
}

async function dumpLandmarks(page) {
  const dump = await page.evaluate(function () {
    function txt(sel) {
      var el = document.querySelector(sel);
      return el ? (el.innerText || el.textContent || '').trim().slice(0, 240) : '(missing)';
    }
    var active = document.querySelector('.view.is-on');
    return {
      title: document.title,
      nav: txt('.rail'),
      libraryHeading: txt('#view-library h1'),
      projectHeading: txt('#view-project h1'),
      grok: txt('#btn-open-grok'),
      codex: txt('#btn-open-codex'),
      projectListCount: document.querySelectorAll('[data-open-project]').length,
      activeView: active ? active.getAttribute('data-view') : null,
      cards: Array.prototype.slice.call(document.querySelectorAll('#project-list [data-open-project]')).slice(0, 12).map(function (el) {
        return el.getAttribute('data-open-project');
      }),
      bodyW: document.body.scrollWidth,
      appH: (document.querySelector('.app') || {}).offsetHeight || 0,
      appW: (document.querySelector('.app') || {}).offsetWidth || 0
    };
  });
  fs.writeFileSync(path.join(SCRATCH, 'dom-landmarks.txt'), JSON.stringify(dump, null, 2));
  return dump;
}

async function measure(page) {
  return page.evaluate(function () {
    var app = document.querySelector('.app');
    var r = app.getBoundingClientRect();
    var painted = document.querySelectorAll('.card, .titlebar, .rail, .sidebar').length;
    return {
      w: r.width,
      h: r.height,
      painted: painted,
      view: document.querySelector('.view.is-on').getAttribute('data-view')
    };
  });
}

async function runTwice(browser, url) {
  const errors1 = [];
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1440, height: 900 });
  page1.on('pageerror', function (err) { errors1.push(String(err)); });
  await page1.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page1.waitForSelector('#project-list [data-open-project]');
  const box1 = await measure(page1);
  log('run1 box ' + JSON.stringify(box1));
  if (box1.w < 1200 || box1.h < 700) throw new Error('run1 drawing size too small: ' + JSON.stringify(box1));
  if (box1.painted < 8) throw new Error('run1 painted fraction too low: ' + JSON.stringify(box1));
  await page1.hover('[data-open-project="hx370-g3e-lineage"]');
  await page1.waitForSelector('#hover-preview.is-on', { timeout: 3000 });
  await page1.screenshot({ path: path.join(SCRATCH, 'mockup-1.png') });
  await page1.click('[data-open-project="hx370-g3e-lineage"]');
  await page1.waitForFunction(function () {
    var v = document.querySelector('.view.is-on');
    return v && v.getAttribute('data-view') === 'project';
  });
  const after1 = await page1.evaluate(function () {
    return {
      view: document.querySelector('.view.is-on').getAttribute('data-view'),
      title: document.querySelector('#project-title').textContent
    };
  });
  log('run1 after click ' + JSON.stringify(after1));
  if (after1.view === box1.view) throw new Error('run1 click did not change view');
  if (after1.view !== 'project') throw new Error('run1 expected project view');
  await dumpLandmarks(page1);
  await page1.close();
  if (errors1.length) throw new Error('run1 page errors: ' + errors1.join('; '));

  const errors2 = [];
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900 });
  page2.on('pageerror', function (err) { errors2.push(String(err)); });
  await page2.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page2.waitForSelector('#project-list [data-open-project]');
  const box2 = await measure(page2);
  log('run2 box ' + JSON.stringify(box2));
  if (box2.w < 1200 || box2.h < 700) throw new Error('run2 drawing size too small');
  if (Math.abs(box2.w - box1.w) > 2 || Math.abs(box2.h - box1.h) > 2) {
    throw new Error('non-deterministic layout ' + JSON.stringify({ box1: box1, box2: box2 }));
  }
  await page2.click('[data-open-project="hx370-g3e-lineage"]');
  await page2.waitForFunction(function () {
    var v = document.querySelector('.view.is-on');
    return v && v.getAttribute('data-view') === 'project';
  });
  await page2.click('#btn-open-grok');
  await page2.waitForSelector('#agent-modal.is-on');
  const modal = await page2.evaluate(function () {
    return {
      on: document.getElementById('agent-modal').classList.contains('is-on'),
      cmd: document.getElementById('agent-modal-cmd').textContent
    };
  });
  log('run2 grok modal ' + JSON.stringify(modal));
  if (!modal.on) throw new Error('agent modal not visible');
  if (modal.cmd.indexOf('grok') === -1 || modal.cmd.indexOf('hx370-g3e-lineage') === -1) {
    throw new Error('modal command missing grok/path: ' + modal.cmd);
  }
  await page2.screenshot({ path: path.join(SCRATCH, 'mockup-2.png') });
  await page2.close();
  if (errors2.length) throw new Error('run2 page errors: ' + errors2.join('; '));
}

(async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const ver = spawnSync('npx', ['--yes', 'playwright', '--version'], {
    encoding: 'utf8',
    timeout: 60000,
    shell: false,
    windowsHide: true
  });
  log('playwright --version status ' + ver.status);
  log('stdout ' + (ver.stdout || '').trim());
  log('stderr ' + (ver.stderr || '').trim());

  const exe = chromePath();
  log('chrome path ' + exe);
  if (!exe) {
    log('launcher cannot find Chrome/Edge; capturing failure and stopping pixel probe');
    flush(true);
    return;
  }

  let puppeteer;
  try {
    const resolved = require.resolve('puppeteer-core', {
      paths: ['C:\\Users\\M\\claw8ex-g3e-spec-film', ROOT]
    });
    log('puppeteer-core ' + resolved);
    puppeteer = require(resolved);
  } catch (err) {
    log('cannot load puppeteer-core: ' + err.message);
    log('launcher cannot start headless browser; capturing failure');
    flush(true);
    return;
  }

  const launched = { server: null, browser: null };
  try {
    const httpd = await startServer();
    launched.server = httpd.server;
    log('serving ' + httpd.url);
    launched.browser = await puppeteer.launch({
      executablePath: exe,
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900']
    });
    await runTwice(launched.browser, httpd.url);
    log('both runs ok');
    flush(true);
  } catch (err) {
    log('PROBE ERROR: ' + err.stack);
    flush(false);
  } finally {
    if (launched.browser) await launched.browser.close();
    if (launched.server) launched.server.close();
  }
})();
