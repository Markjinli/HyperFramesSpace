(function () {
  'use strict';
  function req(method, path, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(path, opts).then(function (r) {
      return r.json().catch(function () { return {}; });
    });
  }
  function postWin(action) {
    try {
      if (window.chrome && chrome.webview && chrome.webview.postMessage) {
        chrome.webview.postMessage(JSON.stringify({ type: 'window', action: action }));
        return Promise.resolve(true);
      }
    } catch (_) {}
    return req('POST', '/api/window', { action: action });
  }
  var scanListeners = [];
  var jobListeners = [];
  window.framespaceAPI = {
    getSettings: function () { return req('GET', '/api/settings'); },
    saveSettings: function (patch) { return req('POST', '/api/settings', patch || {}); },
    queryCatalog: function (opts) {
      var q = new URLSearchParams();
      opts = opts || {};
      if (opts.query) q.set('query', opts.query);
      if (opts.workflow) q.set('workflow', opts.workflow);
      if (opts.limit != null) q.set('limit', String(opts.limit));
      return req('GET', '/api/catalog?' + q.toString());
    },
    getProject: function (id) { return req('GET', '/api/project?id=' + encodeURIComponent(id || '')); },
    catalogCache: function () { return req('GET', '/api/catalog?limit=10000'); },
    scanStart: function (opts) { return req('POST', '/api/scan/start', opts || {}); },
    scanCancel: function () { return req('POST', '/api/scan/cancel', {}); },
    scanStatus: function () { return req('GET', '/api/scan/status'); },
    scan: function () { return req('POST', '/api/scan/start', {}); },
    everythingStatus: function () { return Promise.resolve({ available: false }); },
    usnStatus: function () { return req('GET', '/api/usn'); },
    usnBuild: function () { return req('POST', '/api/scan/start', { reason: 'index' }); },
    occupancy: function () { return req('GET', '/api/occupancy'); },
    processes: function () { return req('GET', '/api/processes'); },
    kill: function (pids) { return req('POST', '/api/kill', { pids: pids || [] }); },
    jobs: function () { return req('GET', '/api/jobs'); },
    runJob: function (spec) { return req('POST', '/api/job', spec || {}); },
    openAgent: function (spec) { return req('POST', '/api/agent', spec || {}); },
    openPath: function (target) { return req('POST', '/api/open', { target: target, reveal: false }); },
    reveal: function (target) { return req('POST', '/api/open', { target: target, reveal: true }); },
    doctor: function () { return Promise.resolve({ cards: [] }); },
    skills: function () { return Promise.resolve([]); },
    fetchCatalog: function () { return Promise.resolve([]); },
    chooseDir: function () { return req('POST', '/api/choose-dir', {}); },
    window: function (action) { return postWin(action); },
    previewStart: function (project) { return req('POST', '/api/preview/start', project || {}); },
    previewRestart: function (project) { return req('POST', '/api/preview/start', project || {}); },
    previewStop: function () { return req('POST', '/api/preview/stop', {}); },
    previewStatus: function () { return req('GET', '/api/preview/status'); },
    resetSettings: function () { return req('POST', '/api/reset', {}); },
    onJobs: function (fn) {
      jobListeners.push(fn);
      return function () { jobListeners = jobListeners.filter(function (x) { return x !== fn; }); };
    },
    onScanEvent: function (fn) {
      scanListeners.push(fn);
      return function () { scanListeners = scanListeners.filter(function (x) { return x !== fn; }); };
    }
  };

  function emitScan(type, payload) {
    scanListeners.forEach(function (fn) { try { fn(type, payload || {}); } catch (_) {} });
  }
  var pollTimer = null;
  function armScanPoll() {
    if (pollTimer) return;
    pollTimer = setInterval(function () {
      req('GET', '/api/scan/status').then(function (st) {
        if (st && st.progress) emitScan('scan:progress', st.progress);
        if (st && st.done) {
          emitScan('scan:done', st.result || {});
          clearInterval(pollTimer);
          pollTimer = null;
        }
        if (st && st.error) {
          emitScan('scan:error', { error: st.error });
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }).catch(function () {});
    }, 250);
  }
  var _start = window.framespaceAPI.scanStart;
  window.framespaceAPI.scanStart = function (opts) {
    armScanPoll();
    return _start(opts);
  };

  document.addEventListener('mousedown', function (ev) {
    var bar = ev.target && ev.target.closest && ev.target.closest('.titlebar');
    if (!bar) return;
    if (ev.target.closest('button, input, a, .win-controls, .lang-switch, .load-chip, .scan-progress')) return;
    postWin('drag');
  });
})();
