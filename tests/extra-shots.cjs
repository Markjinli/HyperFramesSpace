'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const puppeteer = require(require.resolve('puppeteer-core', {
  paths: ['C:\\Users\\M\\claw8ex-g3e-spec-film']
}));
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};
const scratch = process.env.FRAMESPACE_SCRATCH ||
  'C:\\Users\\M\\AppData\\Local\\Temp\\grok-goal-f86da6ce8437\\implementer';

const server = http.createServer(function (req, res) {
  let rel = decodeURIComponent((req.url || '/').split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); res.end('no'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(0, '127.0.0.1', async function () {
  const url = 'http://127.0.0.1:' + server.address().port + '/index.html';
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.click('[data-nav="skills"]');
  await page.waitForSelector('#skill-list .skill-card');
  await page.screenshot({ path: path.join(scratch, 'mockup-skills.png') });
  await page.click('[data-skill-tab="hot"]');
  await page.click('[data-check-catalog="1"]');
  await new Promise(function (r) { setTimeout(r, 200); });
  await page.screenshot({ path: path.join(scratch, 'mockup-skills-hot.png') });
  await page.click('[data-nav="library"]');
  await page.screenshot({ path: path.join(scratch, 'mockup-custom.png') });
  await page.click('[data-sidebar-mode="folders"]');
  await page.waitForSelector('#folder-tree .folder-row');
  await page.screenshot({ path: path.join(scratch, 'mockup-folders.png') });
  var folderBtn = await page.$('[data-folder*="转转视觉优化"]');
  if (folderBtn) {
    await folderBtn.click();
    await new Promise(function (r) { setTimeout(r, 200); });
    await page.screenshot({ path: path.join(scratch, 'mockup-folder-filter.png') });
  }
  var pin = await page.$('#folder-tree [data-pin-folder*="转转视觉优化"]');
  if (pin) await pin.click();
  await page.click('[data-sidebar-mode="custom"]');
  await new Promise(function (r) { setTimeout(r, 200); });
  await page.screenshot({ path: path.join(scratch, 'mockup-pinned.png') });
  await page.click('[data-nav="processes"]');
  await page.waitForSelector('#process-rows .proc');
  await page.screenshot({ path: path.join(scratch, 'mockup-processes.png') });
  await browser.close();
  server.close();
  console.log('extra screenshots ok');
});
