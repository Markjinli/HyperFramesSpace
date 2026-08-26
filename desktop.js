(function () {
  'use strict';
  function t(key, vars) {
    return window.FramespaceI18n && window.FramespaceI18n.t ? window.FramespaceI18n.t(key, vars) : key;
  }
  var api = window.framespaceAPI;
  if (!api || !window.Framespace) return;

  var toastTimer = null;
  var scanning = false;
  var liveProjects = [];

  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }

  function persistPartial() {
    var ui = window.Framespace.getUi && window.Framespace.getUi();
    if (!ui || !ui.state) return;
    api.saveSettings({
      customCollections: ui.state.customCollections,
      pinnedFolders: ui.state.pinnedFolders,
      coverLayout: ui.state.coverLayout,
      coverAtSec: ui.state.coverAtSec,
      hoverShowMs: ui.state.hoverShowMs,
      hoverHideMs: ui.state.hoverHideMs,
      cardSize: ui.state.cardSize,
      scanIntervalSec: ui.state.scanIntervalSec,
      autoScanOnLaunch: !!ui.state.autoScanOnLaunch,
      scanScope: ui.state.scanScope || 'all-fixed',
      scanEngine: ui.state.scanEngine || 'auto',
      autoSnapshot: ui.state.autoSnapshot,
      catalogUrl: ui.state.catalogUrl
    });
  }

  function applyProjects(projects, stampScan) {
    liveProjects = (projects || []).slice();
    window.Framespace.setCatalog(liveProjects);
    var ui = window.Framespace.getUi();
    if (ui && ui.state) {
      var keep = ui.state.customCollections;
      if (!keep || !keep.length) {
        ui.state.customCollections = window.Framespace.seedCustomCollections(liveProjects);
      }
      if (stampScan) ui.state.lastScanAt = Date.now();
    }
    window.Framespace.render();
    var roots = document.getElementById('scan-roots');
    if (roots && window.__fsSettings) {
      roots.innerHTML = (window.__fsSettings.scanRoots || []).map(function (r) {
        return '<div class="root-item">' + String(r).replace(/[&<>]/g, function (c) {
          return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c];
        }) + '</div>';
      }).join('');
    }
  }

  function setDiagnosis(patch) {
    window.__fsDiagnosis = Object.assign({
      scanNote: '',
      previewNote: '',
      processNote: '',
      canFixScan: false,
      canFixPreview: false,
      canReset: true
    }, window.__fsDiagnosis || {}, patch || {});
    if (window.Framespace && window.Framespace.applyDesktopState) {
      window.Framespace.applyDesktopState({ diagnosis: window.__fsDiagnosis });
    }
  }

  function setScanProgress(progress) {
    if (window.Framespace && window.Framespace.applyDesktopState) {
      window.Framespace.applyDesktopState({ scanProgress: progress || null });
    }
  }

  function engineLabel(engine) {
    if (engine === 'everything') return t('scan.engineEverything');
    if (engine === 'walk') return t('scan.engineWalk');
    return t('scan.engineAuto');
  }

  function noteFromScan(pack) {
    pack = pack || {};
    var n = (pack.projects || liveProjects || []).length;
    var engine = pack.engine || '';
    var ev = pack.everything || {};
    var parts = [t('diag.scanSummary', { n: n, engine: engineLabel(engine) })];
    if (ev.available) parts.push(t('diag.everythingOn'));
    else if (ev.running && !ev.esPath) parts.push(t('diag.everythingNoEs'));
    else if (!ev.running) parts.push(t('diag.everythingOff'));
    if (pack.cancelled) parts.push(t('diag.scanCancelled'));
    return parts.join(' ');
  }

  function finishScan(pack) {
    scanning = false;
    setScanProgress(null);
    if (pack && pack.projects) applyProjects(pack.projects, !pack.cancelled);
    if (window.__fsSettings) {
      window.__fsSettings.lastEngine = pack && pack.engine;
    }
    setDiagnosis({
      scanNote: noteFromScan(pack),
      canFixScan: !((pack && pack.projects) || liveProjects).length
    });
    var settings = window.__fsSettings || {};
    if (!pack.cancelled && settings.autoSnapshot) {
      (pack.projects || []).filter(function (p) { return !p.frameSrcs || !p.frameSrcs.length; }).slice(0, 3).forEach(function (p) {
        api.runJob({ action: 'snapshot-9', project: p, title: t('dyn.snap9', { name: p.name }) });
      });
    }
    toast(pack.cancelled ? t('dyn.scanCancelled') : t('dyn.scanResult', { n: (pack.projects || []).length }));
    refreshProcesses();
  }

  function startScan(reason) {
    if (scanning && reason !== 'force') return Promise.resolve();
    scanning = true;
    setScanProgress({ active: true, phase: 'start', percent: 2, text: t('dyn.scanning') });
    toast(reason === 'timer' ? t('dyn.scanningTimer') : t('dyn.scanning'));
    return api.scanStart({ reason: reason || 'manual' });
  }

  function cancelScan() {
    api.scanCancel();
    api.saveSettings({ autoScanOnLaunch: false });
    var ui = window.Framespace.getUi && window.Framespace.getUi();
    if (ui && ui.state) ui.state.autoScanOnLaunch = false;
    if (window.__fsSettings) window.__fsSettings.autoScanOnLaunch = false;
    var autoBox = document.getElementById('set-auto-scan');
    if (autoBox) autoBox.checked = false;
  }

  async function refreshOccupancy() {
    try {
      if (!api.occupancy) return;
      var load = await api.occupancy();
      window.Framespace.applyDesktopState({ load: load });
    } catch (err) {
      console.warn(err);
    }
  }

  async function refreshProcesses() {
    try {
      var pack = await api.processes();
      var orphans = (pack.processes || []).filter(function (p) { return !!p.orphan; });
      setDiagnosis({
        processNote: orphans.length ? t('diag.orphans', { n: orphans.length }) : ''
      });
      window.Framespace.applyDesktopState({
        processes: pack.processes || [],
        host: pack.host,
        load: pack.load,
        diagnosis: window.__fsDiagnosis
      });
    } catch (err) {
      console.warn(err);
    }
  }

  async function refreshDoctor() {
    var projects = window.Framespace.CATALOG || [];
    try {
      var info = await api.doctor(projects);
      window.Framespace.applyDesktopState({ doctor: info });
    } catch (err) {
      window.Framespace.applyDesktopState({
        doctor: { cards: [{ title: t('dyn.doctorFail'), ok: false, detail: String(err.message || err) }] }
      });
    }
  }

  var previewPath = '';
  var previewToken = 0;
  var stopTimer = null;

  function setPreviewUi(state, text, url) {
    var box = document.getElementById('live-preview');
    var statusEl = document.getElementById('live-preview-status');
    var empty = document.getElementById('live-preview-empty');
    var frame = document.getElementById('live-preview-frame');
    if (statusEl) statusEl.textContent = text || '';
    if (!box) return;
    box.classList.toggle('is-on', state === 'on');
    box.classList.toggle('is-busy', state === 'busy');
    if (empty && state !== 'on') empty.textContent = text || t('preview.empty');
    if (frame) {
      if (state === 'on' && url) {
        if (frame.getAttribute('src') !== url) frame.setAttribute('src', url);
      } else if (state !== 'busy') {
        frame.setAttribute('src', 'about:blank');
      }
    }
  }

  function syncPreview(project) {
    if (stopTimer) {
      clearTimeout(stopTimer);
      stopTimer = null;
    }
    if (!project || !project.path) {
      previewPath = '';
      setPreviewUi('off', t('dyn.previewBack'));
      return;
    }
    if (previewPath === project.path) return;
    startPreview(project, true);
  }

  async function startPreview(project, force) {
    var token = ++previewToken;
    previewPath = project.path;
    var frame = document.getElementById('live-preview-frame');
    if (frame) frame.setAttribute('src', 'about:blank');
    setPreviewUi('busy', t('dyn.previewBusy'));
    try {
      var starter = force && api.previewRestart ? api.previewRestart : api.previewStart;
      var info = await starter({
        path: project.path,
        name: project.name,
        pin: project.pin,
        duration: project.duration
      });
      if (token !== previewToken) return;
      previewPath = project.path;
      setPreviewUi('on', (info.reused && !force ? t('dyn.previewReuse', { name: project.name || '' }) : t('dyn.previewOn', { name: project.name || '' })), info.url);
      setDiagnosis({ previewNote: '', canFixPreview: false });
    } catch (err) {
      if (token !== previewToken) return;
      if (!force && api.previewRestart) {
        return startPreview(project, true);
      }
      previewPath = '';
      var msg = (err && err.message) || err;
      setPreviewUi('err', t('dyn.previewErr', { err: msg }));
      setDiagnosis({ previewNote: t('diag.previewStuck', { err: msg }), canFixPreview: true });
    }
  }

  async function stopPreview(notify) {
    previewToken += 1;
    previewPath = '';
    setPreviewUi('off', t('dyn.previewStopped'));
    try { await api.previewStop(); } catch (_) {}
    if (notify) toast(t('dyn.previewStoppedToast'));
  }

  function reloadPreview() {
    var ui = window.Framespace.getUi && window.Framespace.getUi();
    var id = ui && ui.state && ui.state.selectedId;
    var project = id ? window.Framespace.getProject(window.Framespace.CATALOG, id) : null;
    previewPath = '';
    if (project) startPreview(project);
  }

  window.FramespaceDesktop = {
    scan: function (reason) { startScan(reason); },
    cancelScan: cancelScan,
    persist: persistPartial,
    diagnosis: function () { return window.__fsDiagnosis || {}; },
    fixScan: async function () { return startScan('fix'); },
    fixPreview: function () {
      var ui = window.Framespace.getUi && window.Framespace.getUi();
      var id = ui && ui.state && ui.state.selectedId;
      var project = id ? window.Framespace.getProject(window.Framespace.CATALOG, id) : null;
      previewPath = '';
      if (project) startPreview(project, true);
      else stopPreview(false);
    },
    resetApp: async function () {
      try { await api.previewStop(); } catch (_) {}
      try { await api.resetSettings(); } catch (_) {}
      previewPath = '';
      toast(t('diag.resetting'));
      var settings = await api.getSettings();
      window.__fsSettings = settings;
      syncSettingInputs(settings);
      if (window.Framespace && window.Framespace.getUi) {
        var ui = window.Framespace.getUi();
        if (ui && ui.state) {
          ui.state.customCollections = [];
          ui.state.pinnedFolders = [];
          ui.state.selectedId = null;
          ui.state.autoScanOnLaunch = false;
        }
      }
      applyProjects([], false);
      setDiagnosis({ scanNote: t('diag.needScan'), canFixScan: true });
      toast(t('diag.resetDone'));
    },
    runAgent: async function (agent, project) {
      try {
        var res = await api.openAgent({ agent: agent, project: project });
        if (res && res.ok === false) {
          toast(t('dyn.openFail', { err: res.error || t('dyn.unknownErr') }));
          return null;
        }
        var names = { grok: 'Grok Build', codex: 'Codex CLI', chatgpt: 'ChatGPT', 'chatgpt-app': 'ChatGPT', claude: 'Claude Code', cursor: 'Cursor' };
        toast(t('dyn.opened', { name: names[agent] || agent }));
        return res && res.command;
      } catch (err) {
        toast(t('dyn.openFail', { err: err.message || err }));
        return null;
      }
    },
    runCli: async function (action, project) {
      if (action === 'init') {
        var dir = await api.chooseDir();
        if (!dir) return null;
        return api.runJob({ action: 'init', cwd: dir, name: 'hf-' + Date.now().toString(36).slice(-4), title: t('btn.newProject') });
      }
      if (!project && action !== 'doctor') {
        toast(t('dyn.pickFirst'));
        return null;
      }
      if (action === 'doctor') {
        refreshDoctor();
        return api.runJob({ action: 'doctor', title: t('doctor.title') });
      }
      var job = await api.runJob({ action: action, project: project, title: (project && project.name) + ' · ' + action });
      toast(t('dyn.queued'));
      window.Framespace.setViewTo && window.Framespace.setViewTo('jobs');
      return job;
    },
    kill: async function (pids) {
      var res = await api.kill(pids);
      await refreshProcesses();
      toast(t('dyn.killedN', { n: (res.killed || []).length }));
      return res;
    },
    openPath: function (target) { return api.openPath(target); },
    reveal: function (target) { return api.reveal(target); },
    fetchCatalog: function (url) { return api.fetchCatalog(url); },
    toast: toast,
    syncPreview: syncPreview,
    stopPreview: function () { stopPreview(true); },
    reloadPreview: reloadPreview
  };

  function syncSettingInputs(settings) {
    settings = settings || {};
    var rootInput = document.getElementById('set-scan-roots');
    if (rootInput) rootInput.value = (settings.scanRoots || []).join('\n');
    var agentSel = document.getElementById('set-agent');
    if (agentSel) agentSel.value = settings.defaultAgent || 'grok';
    var termSel = document.getElementById('set-terminal');
    if (termSel) termSel.value = settings.terminal || 'wt';
    var localeSel = document.getElementById('set-locale');
    if (localeSel) localeSel.value = settings.locale === 'en' ? 'en' : 'zh';
    var autoScan = document.getElementById('set-auto-scan');
    if (autoScan) autoScan.checked = !!settings.autoScanOnLaunch;
    var scopeSel = document.getElementById('set-scan-scope');
    if (scopeSel) scopeSel.value = settings.scanScope === 'roots' ? 'roots' : 'all-fixed';
    var engineSel = document.getElementById('set-scan-engine');
    if (engineSel) engineSel.value = settings.scanEngine || 'auto';
  }

  async function refreshEverythingHint() {
    var hint = document.getElementById('everything-status');
    if (!hint || !api.everythingStatus) return;
    try {
      var st = await api.everythingStatus();
      if (st.available) hint.textContent = t('set.everythingReady');
      else if (st.running && !st.esPath) hint.textContent = t('set.everythingNoEs');
      else hint.textContent = t('set.everythingMissing');
    } catch (_) {
      hint.textContent = t('set.everythingMissing');
    }
  }

  document.addEventListener('click', function (ev) {
    var win = ev.target && ev.target.closest && ev.target.closest('[data-win]');
    if (win) api.window(win.getAttribute('data-win'));
    var cancel = ev.target && ev.target.closest && ev.target.closest('[data-cancel-scan]');
    if (cancel) cancelScan();
  });

  api.onJobs(function (list) {
    window.Framespace.applyDesktopState({ jobs: list || [] });
  });

  if (api.onScanEvent) {
    api.onScanEvent(function (type, payload) {
      payload = payload || {};
      if (type === 'scan:progress') {
        scanning = true;
        setScanProgress({
          active: true,
          phase: payload.phase || 'locate',
          percent: payload.percent || 0,
          engine: payload.engine || '',
          current: payload.current || '',
          found: payload.found || 0,
          visited: payload.visited || 0,
          index: payload.index || 0,
          total: payload.total || 0
        });
      } else if (type === 'scan:item' && payload.project) {
        if (payload.index === 1) liveProjects = [];
        liveProjects.push(payload.project);
        applyProjects(liveProjects, false);
      } else if (type === 'scan:done') {
        finishScan(payload);
      } else if (type === 'scan:error') {
        scanning = false;
        setScanProgress(null);
        setDiagnosis({ scanNote: t('diag.scanError', { err: payload.error || '' }), canFixScan: true });
        toast(t('dyn.scanError'));
      }
    });
  }

  async function boot() {
    var settings = await api.getSettings();
    window.__fsSettings = settings;
    var skills = [];
    try { skills = await api.skills(); } catch (_) {}
    var initial = window.Framespace.createViewState({
      coverLayout: settings.coverLayout || '9',
      coverAtSec: settings.coverAtSec == null ? 'auto' : settings.coverAtSec,
      hoverShowMs: settings.hoverShowMs == null ? 280 : settings.hoverShowMs,
      hoverHideMs: settings.hoverHideMs == null ? 200 : settings.hoverHideMs,
      cardSize: settings.cardSize || 'm',
      scanIntervalSec: settings.scanIntervalSec || 0,
      autoScanOnLaunch: !!settings.autoScanOnLaunch,
      scanScope: settings.scanScope || 'all-fixed',
      scanEngine: settings.scanEngine || 'auto',
      autoSnapshot: !!settings.autoSnapshot,
      catalogUrl: settings.catalogUrl,
      customCollections: settings.customCollections || [],
      pinnedFolders: settings.pinnedFolders || [],
      processes: [],
      skills: skills.length ? skills : undefined,
      jobs: []
    });
    window.Framespace.setCatalog([]);
    window.Framespace.mount(document, initial);
    syncSettingInputs(settings);
    var live = document.getElementById('status-live');
    if (live) live.textContent = t('dyn.live');
    var cache = null;
    try { cache = await api.catalogCache(); } catch (_) {}
    if (cache && cache.projects && cache.projects.length) {
      applyProjects(cache.projects, false);
      setDiagnosis({
        scanNote: t('diag.cacheReady', { n: cache.projects.length }),
        canFixScan: false
      });
    } else {
      setDiagnosis({ scanNote: t('diag.needScan'), canFixScan: true });
    }
    refreshEverythingHint();
    if (settings.autoScanOnLaunch) startScan('boot');
    refreshDoctor();
    refreshOccupancy();
    setInterval(refreshOccupancy, 2000);
    setInterval(refreshProcesses, 8000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
