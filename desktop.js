(function () {
  'use strict';
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

  async function scanNow(reason) {
    toast(reason === 'timer' ? '定时扫描中…' : '正在扫描磁盘…');
    var settings = await api.getSettings();
    window.__fsSettings = settings;
    var projects = await api.scan(settings.scanRoots);
    applyProjects(projects);
    if (settings.autoSnapshot) {
      (projects || []).filter(function (p) { return !p.frameSrcs || !p.frameSrcs.length; }).slice(0, 3).forEach(function (p) {
        api.runJob({ action: 'snapshot-9', project: p, title: p.name + ' · 抽 9 帧' });
      });
    }
    toast('扫描完成 · ' + projects.length + ' 个工程');
    refreshProcesses();
    return projects;
  }

  async function refreshProcesses() {
    try {
      var pack = await api.processes();
      window.Framespace.applyDesktopState({
        processes: pack.processes || [],
        host: pack.host,
        load: pack.load
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
        doctor: { cards: [{ title: '诊断失败', ok: false, detail: String(err.message || err) }] }
      });
    }
  }

  window.FramespaceDesktop = {
    scan: function (reason) { scanNow(reason); },
    persist: persistPartial,
    runAgent: async function (agent, project) {
      var res = await api.openAgent({ agent: agent, project: project });
      toast('已打开 ' + agent);
      return res && res.command;
    },
    runCli: async function (action, project) {
      if (action === 'init') {
        var dir = await api.chooseDir();
        if (!dir) return null;
        return api.runJob({ action: 'init', cwd: dir, name: 'hf-' + Date.now().toString(36).slice(-4), title: '新建工程' });
      }
      if (!project && action !== 'doctor') {
        toast('先在项目库里选一个工程');
        return null;
      }
      if (action === 'doctor') {
        refreshDoctor();
        return api.runJob({ action: 'doctor', title: '环境诊断' });
      }
      var job = await api.runJob({ action: action, project: project, title: (project && project.name) + ' · ' + action });
      toast('已加入任务队列');
      window.Framespace.setViewTo && window.Framespace.setViewTo('jobs');
      return job;
    },
    kill: async function (pids) {
      var res = await api.kill(pids);
      await refreshProcesses();
      toast('已结束 ' + ((res.killed || []).length) + ' 个进程');
      return res;
    },
    openPath: function (target) { return api.openPath(target); },
    reveal: function (target) { return api.reveal(target); },
    fetchCatalog: function (url) { return api.fetchCatalog(url); },
    toast: toast
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
    var live = document.getElementById('status-live');
    if (live) live.textContent = 'Framespace · 桌面版';
    await scanNow('boot');
    refreshDoctor();
    setInterval(refreshProcesses, 8000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();