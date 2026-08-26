(function () {
  'use strict';
  function t(key, vars) {
    return window.FramespaceI18n && window.FramespaceI18n.t ? window.FramespaceI18n.t(key, vars) : key;
  }
  var api = window.framespaceAPI;
  if (!api || !window.Framespace) return;

  var toastTimer = null;
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
      autoSnapshot: ui.state.autoSnapshot,
      catalogUrl: ui.state.catalogUrl
    });
  }

  function applyProjects(projects) {
    window.Framespace.setCatalog(projects || []);
    var ui = window.Framespace.getUi();
    if (ui && ui.state) {
      var keep = ui.state.customCollections;
      if (!keep || !keep.length) {
        ui.state.customCollections = window.Framespace.seedCustomCollections(projects);
      }
      ui.state.lastScanAt = Date.now();
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

  function unpackScan(result) {
    if (Array.isArray(result)) return { projects: result, added: [], scanRoots: (window.__fsSettings && window.__fsSettings.scanRoots) || [] };
    return {
      projects: result && result.projects || [],
      added: result && result.added || [],
      scanRoots: result && result.scanRoots || []
    };
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

  async function scanNow(reason) {
    toast(reason === 'timer' ? t('dyn.scanningTimer') : t('dyn.scanning'));
    var settings = await api.getSettings();
    window.__fsSettings = settings;
    if (window.FramespaceI18n) {
      window.FramespaceI18n.setLocale(settings.locale || 'zh');
      window.FramespaceI18n.apply(document);
    }
    var pack = unpackScan(await api.scan(settings.scanRoots));
    var projects = pack.projects;
    window.__fsSettings = Object.assign({}, settings, { scanRoots: pack.scanRoots.length ? pack.scanRoots : settings.scanRoots });
    applyProjects(projects);
    var missing = (projects || []).filter(function (p) { return /CLAW8Final\\videos/i.test(p.path || ''); }).length;
    var videosRoot = 'C:\\1AI\\1cursorfull\\CLAW8Final\\videos';
    var fromVideos = (projects || []).filter(function (p) {
      return String(p.path || '').toLowerCase().indexOf(videosRoot.toLowerCase()) === 0;
    }).length;
    setDiagnosis({
      scanNote: pack.added.length
        ? t('diag.scanAdded', { n: projects.length, path: pack.added.join(', ') })
        : (fromVideos ? t('diag.scanOk', { n: projects.length }) : t('diag.scanMissing')),
      canFixScan: !fromVideos
    });
    if (settings.autoSnapshot) {
      (projects || []).filter(function (p) { return !p.frameSrcs || !p.frameSrcs.length; }).slice(0, 3).forEach(function (p) {
        api.runJob({ action: 'snapshot-9', project: p, title: t('dyn.snap9', { name: p.name }) });
      });
    }
    toast(t('dyn.scanResult', { n: projects.length }));
    refreshProcesses();
    return projects;
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
    scan: function (reason) { scanNow(reason); },
    persist: persistPartial,
    diagnosis: function () { return window.__fsDiagnosis || {}; },
    fixScan: async function () { return scanNow('fix'); },
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
      var rootInput = document.getElementById('set-scan-roots');
      if (rootInput) rootInput.value = (settings.scanRoots || []).join('\n');
      if (window.Framespace && window.Framespace.getUi) {
        var ui = window.Framespace.getUi();
        if (ui && ui.state) {
          ui.state.customCollections = [];
          ui.state.pinnedFolders = [];
          ui.state.selectedId = null;
        }
      }
      await scanNow('reset');
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

  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest && ev.target.closest('[data-win]');
    if (t) api.window(t.getAttribute('data-win'));
  });

  api.onJobs(function (list) {
    window.Framespace.applyDesktopState({ jobs: list || [] });
  });

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
    var rootInput = document.getElementById('set-scan-roots');
    if (rootInput) rootInput.value = (settings.scanRoots || []).join('\n');
    var agentSel = document.getElementById('set-agent');
    if (agentSel) agentSel.value = settings.defaultAgent || 'grok';
    var termSel = document.getElementById('set-terminal');
    if (termSel) termSel.value = settings.terminal || 'wt';
    var localeSel = document.getElementById('set-locale');
    if (localeSel) localeSel.value = settings.locale === 'en' ? 'en' : 'zh';
    var live = document.getElementById('status-live');
    if (live) live.textContent = t('dyn.live');
    await scanNow('boot');
    refreshDoctor();
    refreshOccupancy();
    setInterval(refreshOccupancy, 2000);
    setInterval(refreshProcesses, 8000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();