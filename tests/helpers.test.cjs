'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const {
  CATALOG,
  filterCatalog,
  createViewState,
  selectProject,
  goLibrary,
  setView,
  getProject,
  buildAgentCommand,
  buildCliCommand,
  equalFrameTimes,
  oddSecondTimes,
  coverCells,
  coverIndexPlan,
  collectionsFromCatalog,
  seedCustomCollections,
  addCustomCollection,
  assignProjectToCollection,
  pathIsUnder,
  projectsUnderFolder,
  buildFolderTree,
  togglePinnedFolder,
  renamePinnedFolder,
  pinnedFolderLabel,
  isFolderPinned,
  hoverHideDelayMs,
  hoverShowDelayMs,
  clampHoverSize,
  cardMinPx,
  parseScanInterval,
  nextScanAt,
  listOrphans,
  buildKillCommand,
  killProcesses,
  buildSnapshotCommand,
  PROCESS_SEED,
  HOST_RESOURCES,
  summarizeHyperFramesLoad,
  pauseRenderProcesses,
  resumeRenderProcesses,
  isRenderProcess,
  parseSkillCatalog,
  isValidCatalogUrl,
  filterSkills,
  rateSkill,
  annotateSkill,
  removeSkill,
  skillNeedsUpdate,
  mergeHotWithInstalled,
  skillUpdateCommand,
  skillDeleteCommand,
  skillInstallCommand,
  catalogCheckCommand,
  installHotSkill,
  SKILL_SEED,
  HOT_SKILL_CATALOG
} = require('..\\app.js');

const failures = [];
function check(name, fn) {
  try {
    fn();
    console.log('ok  ' + name);
  } catch (err) {
    failures.push(name);
    console.log('fail  ' + name);
    console.log('  ' + err.message);
  }
}

check('catalog is representative HyperFrames rows', function () {
  assert.ok(Array.isArray(CATALOG) && CATALOG.length >= 3);
  const claw = getProject(CATALOG, 'claw8ex-g3e-spec-film');
  const hx = getProject(CATALOG, 'hx370-g3e-lineage');
  assert.ok(claw, 'claw8ex row missing');
  assert.ok(hx, 'hx370 row missing');
  assert.ok(claw.path.indexOf('claw8ex-g3e-spec-film') !== -1);
  assert.strictEqual(claw.workflow, 'general-video');
  assert.strictEqual(hx.workflow, 'motion-graphics');
  assert.ok(hx.path.indexOf('hx370-g3e-lineage') !== -1);
});

check('search keeps matching projects and drops non-matches', function () {
  const hits = filterCatalog(CATALOG, { query: 'HX370' });
  const ids = hits.map(function (p) { return p.id; });
  assert.ok(ids.indexOf('hx370-g3e-lineage') !== -1, 'HX370 should keep lineage project');
  assert.ok(ids.indexOf('claw8ex-g3e-spec-film') === -1, 'HX370 should drop spec-film');
  assert.ok(ids.indexOf('changestyle5') === -1, 'HX370 should drop changestyle5');
});

check('workflow filter keeps motion-graphics only', function () {
  const hits = filterCatalog(CATALOG, { workflow: 'motion-graphics' });
  assert.ok(hits.length >= 1);
  hits.forEach(function (p) {
    assert.strictEqual(p.workflow, 'motion-graphics');
  });
  const ids = hits.map(function (p) { return p.id; });
  assert.ok(ids.indexOf('hx370-g3e-lineage') !== -1);
  assert.ok(ids.indexOf('claw8ex-g3e-spec-film') === -1);
});

check('collection filter 转转笔记本 drops 掌机芯片', function () {
  const hits = filterCatalog(CATALOG, { collection: '转转笔记本' });
  assert.ok(hits.length >= 2);
  hits.forEach(function (p) {
    assert.strictEqual(p.collection, '转转笔记本');
  });
  const ids = hits.map(function (p) { return p.id; });
  assert.ok(ids.indexOf('changestyle5') !== -1);
  assert.ok(ids.indexOf('hx370-g3e-lineage') === -1);
});

check('AND tokens: 规格 掌机 keeps spec-film, drops typeset', function () {
  const hits = filterCatalog(CATALOG, { query: '规格 掌机' });
  const ids = hits.map(function (p) { return p.id; });
  assert.ok(ids.indexOf('claw8ex-g3e-spec-film') !== -1);
  assert.ok(ids.indexOf('changestyle4typeset') === -1);
});

check('view-state library → named project is observable', function () {
  let state = createViewState();
  assert.strictEqual(state.view, 'library');
  assert.strictEqual(state.selectedId, null);
  state = selectProject(state, 'claw8ex-g3e-spec-film');
  assert.strictEqual(state.view, 'project');
  assert.strictEqual(state.selectedId, 'claw8ex-g3e-spec-film');
  const back = goLibrary(state);
  assert.strictEqual(back.view, 'library');
  assert.strictEqual(back.selectedId, 'claw8ex-g3e-spec-film');
});

check('setView(project) without selection falls back to library', function () {
  const state = setView(createViewState(), 'project');
  assert.strictEqual(state.view, 'library');
});

check('Grok Build command includes grok and the project path', function () {
  const project = getProject(CATALOG, 'claw8ex-g3e-spec-film');
  const cmd = buildAgentCommand('grok', project);
  assert.ok(/grok/i.test(cmd), 'agent name grok missing: ' + cmd);
  assert.ok(cmd.indexOf('--cwd') !== -1, '--cwd missing: ' + cmd);
  assert.ok(cmd.indexOf(project.path) !== -1, 'path missing: ' + cmd);
});

check('Codex command includes codex and the project path', function () {
  const project = getProject(CATALOG, 'hx370-g3e-lineage');
  const cmd = buildAgentCommand('codex', project);
  assert.ok(/codex/i.test(cmd), 'agent name codex missing: ' + cmd);
  assert.ok(cmd.indexOf(project.path) !== -1, 'path missing: ' + cmd);
});

check('CLI extras include preview lint check snapshot render doctor init', function () {
  const project = getProject(CATALOG, 'changestyle5');
  const preview = buildCliCommand('preview', project);
  const lint = buildCliCommand('lint', project);
  const checkCmd = buildCliCommand('check', project);
  const snapshot = buildCliCommand('snapshot', project);
  const render = buildCliCommand('render', project);
  const doctor = buildCliCommand('doctor', project);
  const init = buildCliCommand('init', project);
  assert.ok(preview.indexOf('preview') !== -1 && preview.indexOf(project.path) !== -1);
  assert.ok(lint.indexOf('lint') !== -1);
  assert.ok(checkCmd.indexOf('check') !== -1);
  assert.ok(snapshot.indexOf('snapshot') !== -1);
  assert.ok(render.indexOf('render') !== -1);
  assert.ok(doctor.indexOf('doctor') !== -1);
  assert.ok(init.indexOf('init') !== -1);
});

check('equal 9 frames include first and last', function () {
  const eight = equalFrameTimes(8, 9);
  assert.strictEqual(eight.length, 9);
  assert.strictEqual(eight[0], 0);
  assert.strictEqual(eight[8], 8);
  assert.strictEqual(eight[4], 4);
  const ten = equalFrameTimes(10, 9);
  assert.strictEqual(ten[0], 0);
  assert.strictEqual(ten[8], 10);
  const eighty = equalFrameTimes(80, 9);
  assert.strictEqual(eighty[0], 0);
  assert.strictEqual(eighty[8], 80);
  assert.strictEqual(eighty[1], 10);
});

check('odd seconds 1,3,5,7,9 is also cheap but weaker for long films', function () {
  const odd = oddSecondTimes(10);
  assert.deepStrictEqual(odd, [1, 3, 5, 7, 9]);
  const short = oddSecondTimes(8);
  assert.ok(short.indexOf(8) === -1, 'odd-seconds misses the last frame of an 8s piece');
});

check('cover cells 1/4/9 keep matching layout', function () {
  const p = getProject(CATALOG, 'hx370-g3e-lineage');
  const one = coverCells(p, '1');
  const four = coverCells(p, '4');
  const nine = coverCells(p, '9');
  assert.strictEqual(one.length, 1);
  assert.strictEqual(four.length, 4);
  assert.strictEqual(nine.length, 9);
  assert.deepStrictEqual(coverIndexPlan('4'), [0, 3, 5, 8]);
  assert.strictEqual(nine[0].t, 0);
  assert.strictEqual(nine[8].t, p.duration);
  assert.ok(nine[4].src && nine[4].src.indexOf('hx370') !== -1);
});

check('snapshot command uses --frames 9', function () {
  const p = getProject(CATALOG, 'changestyle5');
  const cmd = buildSnapshotCommand(p, { count: 9 });
  assert.ok(cmd.indexOf('snapshot') !== -1);
  assert.ok(cmd.indexOf('--frames 9') !== -1);
  assert.ok(cmd.indexOf(p.path) !== -1);
  const odd = buildSnapshotCommand(p, { at: oddSecondTimes(p.duration) });
  assert.ok(odd.indexOf('--at ') !== -1);
});

check('scan interval parser and next fire time', function () {
  assert.strictEqual(parseScanInterval('off'), 0);
  assert.strictEqual(parseScanInterval('60'), 60);
  const next = nextScanAt(1000, 60, 1000);
  assert.strictEqual(next, 61000);
  assert.strictEqual(nextScanAt(1000, 0, 2000), null);
});

check('occupancy percents drop when render is paused', function () {
  const live = summarizeHyperFramesLoad(PROCESS_SEED, HOST_RESOURCES);
  assert.ok(live.cpu > 0, 'cpu');
  assert.ok(live.mem > 0, 'mem');
  assert.ok(live.gpu > 0, 'gpu');
  assert.ok(live.cpu <= 100 && live.mem <= 100 && live.gpu <= 100);
  assert.ok(live.rendering);
  assert.ok(PROCESS_SEED.some(isRenderProcess));
  const pausedList = pauseRenderProcesses(PROCESS_SEED);
  const paused = summarizeHyperFramesLoad(pausedList, HOST_RESOURCES);
  assert.ok(paused.gpu < live.gpu, 'gpu should fall after pause');
  assert.ok(paused.cpu < live.cpu, 'cpu should fall after pause');
  assert.ok(!paused.rendering);
  assert.ok(paused.paused);
  const back = summarizeHyperFramesLoad(resumeRenderProcesses(pausedList), HOST_RESOURCES);
  assert.ok(back.rendering);
  assert.strictEqual(back.gpu, live.gpu);
});

check('kill leftover processes drops orphans and keeps live encode', function () {
  const orphans = listOrphans(PROCESS_SEED);
  assert.ok(orphans.length >= 1);
  orphans.forEach(function (p) { assert.ok(p.orphan); });
  const cmd = buildKillCommand(orphans[0]);
  assert.ok(cmd.indexOf('taskkill') !== -1);
  assert.ok(String(cmd).indexOf(String(orphans[0].pid)) !== -1);
  const result = killProcesses(PROCESS_SEED, function (p) { return !!p.orphan; });
  result.remaining.forEach(function (p) { assert.ok(!p.orphan); });
  assert.strictEqual(result.killed.length, orphans.length);
  assert.ok(result.remaining.some(function (p) { return p.kind === 'encode'; }));
});

check('collections carry members for series mosaics', function () {
  const groups = collectionsFromCatalog(CATALOG);
  const names = groups.map(function (g) { return g.name; });
  assert.ok(names.indexOf('掌机芯片') !== -1);
  assert.ok(names.indexOf('转转笔记本') !== -1);
  const handheld = groups.filter(function (g) { return g.id === '掌机芯片'; })[0];
  assert.ok(handheld.count >= 2);
  assert.ok(cardMinPx('s') < cardMinPx('m'));
  assert.ok(cardMinPx('xl') > cardMinPx('l'));
});

check('custom collection add and drag-assign keeps membership', function () {
  var cols = seedCustomCollections(CATALOG);
  assert.ok(cols.some(function (c) { return c.id === '转转笔记本'; }));
  var added = addCustomCollection(cols, ' palettes ');
  assert.ok(added.id);
  var named = added.collections.filter(function (c) { return c.id === added.id; })[0];
  assert.strictEqual(named.name, 'palettes');
  var next = assignProjectToCollection(added.collections, added.id, 'hx370-g3e-lineage');
  var pal = next.filter(function (c) { return c.id === added.id; })[0];
  assert.ok(pal.projectIds.indexOf('hx370-g3e-lineage') !== -1);
  var again = assignProjectToCollection(next, added.id, 'hx370-g3e-lineage');
  var pal2 = again.filter(function (c) { return c.id === added.id; })[0];
  assert.strictEqual(pal2.projectIds.filter(function (id) { return id === 'hx370-g3e-lineage'; }).length, 1);
  var hits = filterCatalog(CATALOG, { collection: added.id, customCollections: again });
  assert.strictEqual(hits.length, 1);
  assert.strictEqual(hits[0].id, 'hx370-g3e-lineage');
});

check('folder tree flattens nested HyperFrames projects', function () {
  assert.ok(pathIsUnder('C:\\Users\\M\\Documents\\转转视觉优化\\changestyle5', 'C:\\Users\\M\\Documents\\转转视觉优化'));
  assert.ok(!pathIsUnder('C:\\Users\\M\\Videos\\hx370-g3e-lineage', 'C:\\Users\\M\\Documents\\转转视觉优化'));
  var under = projectsUnderFolder(CATALOG, 'C:\\Users\\M\\Documents\\转转视觉优化');
  assert.ok(under.length >= 5);
  assert.ok(under.some(function (p) { return p.id === 'changestyle5'; }));
  assert.ok(under.some(function (p) { return p.id === 'predator-neo'; }));
  assert.ok(!under.some(function (p) { return p.id === 'hx370-g3e-lineage'; }));
  var tree = buildFolderTree(CATALOG);
  assert.ok(tree.root);
  assert.ok(tree.root.projectCount >= 8);
  var hits = filterCatalog(CATALOG, { folder: 'C:\\Users\\M\\Documents\\转转视觉优化\\changestyle4typeset-其他笔记本' });
  assert.ok(hits.length >= 2);
  var pins = togglePinnedFolder([], 'C:\\Users\\M\\Documents\\转转视觉优化');
  assert.strictEqual(pins.length, 1);
  assert.ok(isFolderPinned(pins, 'C:\\Users\\M\\Documents\\转转视觉优化'));
  assert.strictEqual(pinnedFolderLabel(pins[0]), '转转视觉优化');
  var renamed = renamePinnedFolder(pins, 'C:\\Users\\M\\Documents\\转转视觉优化', ' 转转成片库 ');
  assert.strictEqual(pinnedFolderLabel(renamed[0]), '转转成片库');
  assert.strictEqual(renamed[0].path, 'C:\\Users\\M\\Documents\\转转视觉优化');
  var cleared = renamePinnedFolder(renamed, 'C:\\Users\\M\\Documents\\转转视觉优化', '   ');
  assert.strictEqual(pinnedFolderLabel(cleared[0]), '转转视觉优化');
  var un = togglePinnedFolder(pins, 'C:\\Users\\M\\Documents\\转转视觉优化');
  assert.strictEqual(un.length, 0);
});

check('hover hide delay is 1s and size clamps', function () {
  assert.strictEqual(hoverHideDelayMs(), 200);
  assert.strictEqual(hoverShowDelayMs(), 280);
  var s = clampHoverSize(120, 50);
  assert.ok(s.width >= 360);
  assert.ok(s.height >= 200);
  var big = clampHoverSize(4000, 4000);
  assert.ok(big.width <= 900);
  assert.ok(big.height <= 720);
});

check('skill catalog parse, rate, note, delete, hot install', function () {
  assert.ok(isValidCatalogUrl('https://raw.githubusercontent.com/you/repo/main/catalog.json'));
  assert.ok(!isValidCatalogUrl('https://example.com/catalog.json'));
  var parsed = parseSkillCatalog(HOT_SKILL_CATALOG);
  assert.ok(parsed.length >= 3);
  var cli = parsed.filter(function (s) { return s.id === 'hyperframes-cli'; })[0];
  var local = SKILL_SEED.filter(function (s) { return s.id === 'hyperframes-cli'; })[0];
  assert.ok(skillNeedsUpdate(local, cli));
  var merged = mergeHotWithInstalled(parsed, SKILL_SEED);
  var mcli = merged.filter(function (s) { return s.id === 'hyperframes-cli'; })[0];
  assert.ok(mcli.installed && mcli.updateAvailable);
  var pack = merged.filter(function (s) { return s.id === 'zhuan-laptop-pack'; })[0];
  assert.ok(pack && !pack.installed);
  var rated = rateSkill(SKILL_SEED, 'media-use', 2);
  assert.strictEqual(rated.filter(function (s) { return s.id === 'media-use'; })[0].rating, 2);
  var noted = annotateSkill(SKILL_SEED, 'imagine', '常用出图');
  assert.ok(noted.filter(function (s) { return s.id === 'imagine'; })[0].note.indexOf('出图') !== -1);
  var gone = removeSkill(SKILL_SEED, 'imagine');
  assert.ok(!gone.some(function (s) { return s.id === 'imagine'; }));
  var after = installHotSkill(SKILL_SEED, pack);
  assert.ok(after.some(function (s) { return s.id === 'zhuan-laptop-pack'; }));
  var hits = filterSkills(SKILL_SEED, 'cli');
  assert.ok(hits.some(function (s) { return s.id === 'hyperframes-cli'; }));
  assert.ok(skillUpdateCommand(local).indexOf('hyperframes skills update') !== -1);
  assert.ok(skillDeleteCommand(local).indexOf('rmdir') !== -1);
  assert.ok(skillInstallCommand(pack).indexOf('git clone') !== -1);
  assert.ok(catalogCheckCommand('https://raw.githubusercontent.com/you/repo/main/catalog.json').indexOf('catalog.json') !== -1);
});

check('HTML mockup source has library / workbench / agent labels', function () {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.indexOf('项目库') !== -1);
  assert.ok(html.indexOf('调整修改') !== -1);
  assert.ok(html.indexOf('Grok Build') !== -1);
  assert.ok(html.indexOf('Codex') !== -1);
  assert.ok(html.indexOf('id="view-library"') !== -1);
  assert.ok(html.indexOf('id="view-project"') !== -1);
  assert.ok(html.indexOf('id="btn-open-grok"') !== -1);
  assert.ok(html.indexOf('id="btn-open-codex"') !== -1);
  assert.ok(html.indexOf('<script src="app.js">') !== -1);
  assert.ok(html.indexOf('九宫格') !== -1);
  assert.ok(html.indexOf('进程') !== -1);
  assert.ok(html.indexOf('定时扫描') !== -1);
  assert.ok(html.indexOf('id="hover-preview"') !== -1);
  assert.ok(html.indexOf('id="series-list"') !== -1);
  assert.ok(html.indexOf('自定义项目') !== -1);
  assert.ok(html.indexOf('data-sidebar-mode="folders"') !== -1);
  assert.ok(html.indexOf('data-add-collection') !== -1);
  assert.ok(html.indexOf('id="hover-resizer"') !== -1);
  assert.ok(html.indexOf('改别名') !== -1 || html.indexOf('data-rename-pin') !== -1 || html.indexOf('钉住后可改别名') !== -1);
  assert.ok(html.indexOf('HyperFrames 占用') !== -1);
  assert.ok(html.indexOf('一键清理') !== -1);
  assert.ok(html.indexOf('data-pause-render') !== -1);
  assert.ok(html.indexOf('data-nav="skills"') !== -1);
  assert.ok(html.indexOf('id="view-skills"') !== -1);
  assert.ok(html.indexOf('检查热门') !== -1);
  assert.ok(html.indexOf('原因分析') !== -1);
  assert.ok(html.indexOf('data-reset-app') !== -1);
  assert.ok(html.indexOf('data-fix-scan') !== -1);
  assert.ok(html.indexOf('启动时自动扫描') !== -1);
  assert.ok(html.indexOf('id="scan-progress"') !== -1);
});

if (failures.length) {
  console.log('\n' + failures.length + ' failed');
  process.exit(1);
}
console.log('\nall helpers tests passed');
