'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const scan = require('..\\electron\\lib\\scan.cjs');
const cache = require('..\\electron\\lib\\catalog-cache.cjs');
const store = require('..\\electron\\lib\\store.cjs');
const everything = require('..\\electron\\lib\\everything.cjs');
const drives = require('..\\electron\\lib\\drives.cjs');

const failures = [];
function check(name, fn) {
  const ret = fn();
  return Promise.resolve(ret).then(function () {
    console.log('ok  ' + name);
  }).catch(function (err) {
    failures.push(name);
    console.log('fail  ' + name);
    console.log('  ' + err.message);
  });
}

async function run() {
  await check('store defaults keep launch scan off and full-disk scope', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hfs-store-'));
    const settings = store.load(dir);
    assert.strictEqual(settings.autoScanOnLaunch, false);
    assert.strictEqual(settings.scanScope, 'all-fixed');
    assert.strictEqual(settings.scanEngine, 'auto');
  });

  await check('catalog cache round-trips projects', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hfs-cache-'));
    cache.save(dir, { engine: 'walk', scope: 'all-fixed', projects: [{ id: 'demo', path: 'C\\\\demo' }] });
    const loaded = cache.load(dir);
    assert.ok(loaded);
    assert.strictEqual(loaded.engine, 'walk');
    assert.strictEqual(loaded.projects[0].id, 'demo');
  });

  await check('walkAsync finds nested hyperframes.json and skips node_modules', async function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hfs-walk-'));
    const hit = path.join(dir, 'outer', 'project');
    const skipped = path.join(dir, 'node_modules', 'hidden');
    fs.mkdirSync(hit, { recursive: true });
    fs.mkdirSync(skipped, { recursive: true });
    fs.writeFileSync(path.join(hit, 'hyperframes.json'), '{}');
    fs.writeFileSync(path.join(skipped, 'hyperframes.json'), '{}');
    const found = [];
    await scan.walkAsync(dir, 8, found, new Set());
    assert.ok(found.some((p) => path.normalize(p) === path.normalize(hit)));
    assert.ok(!found.some((p) => p.toLowerCase().indexOf('node_modules') !== -1));
  });

  await check('shouldSkipDir covers Program Files', function () {
    assert.strictEqual(scan.shouldSkipDir('Program Files'), true);
    assert.strictEqual(scan.shouldSkipDir('Windows'), true);
    assert.strictEqual(scan.shouldSkipDir('1AI'), false);
  });

  await check('Everything probe returns a stable shape', function () {
    const probe = everything.probe();
    assert.strictEqual(typeof probe.running, 'boolean');
    assert.strictEqual(typeof probe.esPath, 'string');
    assert.strictEqual(typeof probe.available, 'boolean');
  });

  await check('fixed drive list is non-empty on Windows', function () {
    const list = drives.listFixedDrives();
    assert.ok(Array.isArray(list));
    assert.ok(list.some((d) => /^[A-Z]:\\$/i.test(d)));
  });

  if (failures.length) {
    console.log('\n' + failures.length + ' failed');
    process.exit(1);
  }
  console.log('\nall scan-engine tests passed');
}

run();
