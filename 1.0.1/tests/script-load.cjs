'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [];
html.replace(/<script src="([^"]+)"><\/script>/g, function (_, src) {
  if (src.indexOf('module') !== -1) {
    throw new Error('ES module script not allowed without file: guard: ' + src);
  }
  scripts.push(src);
  return _;
});
if (html.indexOf('type="module"') !== -1) {
  throw new Error('page uses ES modules; must detect file: and explain how to serve');
}

assert.ok(scripts.length >= 1, 'no classic script tags found');

const window = {};
const sandbox = {
  window: window,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
sandbox.globalThis = sandbox;
window.window = window;
Object.defineProperty(sandbox, 'module', { get: function () { return undefined; } });
Object.defineProperty(sandbox, 'require', { get: function () { return undefined; } });
Object.defineProperty(window, 'module', { get: function () { return undefined; } });
Object.defineProperty(window, 'require', { get: function () { return undefined; } });

scripts.forEach(function (src) {
  const file = path.join(root, src);
  const code = fs.readFileSync(file, 'utf8');
  assert.ok(code.indexOf('require(') === -1 || /typeof module/.test(code), 'script must not depend on Node require at top level');
  vm.runInNewContext(code, sandbox, { filename: src });
});

assert.ok(sandbox.window.Framespace, 'Framespace global missing after load');
assert.strictEqual(typeof sandbox.window.Framespace.filterCatalog, 'function');
assert.strictEqual(typeof sandbox.window.Framespace.selectProject, 'function');
assert.strictEqual(typeof sandbox.window.Framespace.buildAgentCommand, 'function');
assert.ok(Array.isArray(sandbox.window.Framespace.CATALOG));
assert.strictEqual(typeof sandbox.module, 'undefined');
assert.strictEqual(typeof sandbox.require, 'undefined');

const hx = sandbox.window.Framespace.CATALOG.filter(function (p) {
  return p.id === 'hx370-g3e-lineage';
})[0];
const kept = sandbox.window.Framespace.filterCatalog(sandbox.window.Framespace.CATALOG, { query: 'HX370' });
assert.ok(kept.some(function (p) { return p.id === hx.id; }));

console.log('scripts loaded:', scripts.join(', '));
console.log('Framespace globals installed without Node module/require');
console.log('catalog size', sandbox.window.Framespace.CATALOG.length);
console.log('ok');
