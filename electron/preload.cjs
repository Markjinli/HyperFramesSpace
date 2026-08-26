const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('framespaceAPI', {
  getSettings: () => ipcRenderer.invoke('desktop:get-settings'),
  saveSettings: (patch) => ipcRenderer.invoke('desktop:save-settings', patch),
  scan: (roots) => ipcRenderer.invoke('desktop:scan', roots),
  scanStart: (opts) => ipcRenderer.invoke('desktop:scan-start', opts || {}),
  scanCancel: () => ipcRenderer.invoke('desktop:scan-cancel'),
  scanStatus: () => ipcRenderer.invoke('desktop:scan-status'),
  catalogCache: () => ipcRenderer.invoke('desktop:catalog-cache'),
  everythingStatus: () => ipcRenderer.invoke('desktop:everything-status'),
  occupancy: () => ipcRenderer.invoke('desktop:occupancy'),
  processes: () => ipcRenderer.invoke('desktop:processes'),
  kill: (pids) => ipcRenderer.invoke('desktop:kill', pids),
  jobs: () => ipcRenderer.invoke('desktop:jobs'),
  runJob: (spec) => ipcRenderer.invoke('desktop:run-job', spec),
  openAgent: (spec) => ipcRenderer.invoke('desktop:open-agent', spec),
  openPath: (target) => ipcRenderer.invoke('desktop:open-path', target),
  reveal: (target) => ipcRenderer.invoke('desktop:reveal', target),
  doctor: (projects) => ipcRenderer.invoke('desktop:doctor', projects),
  skills: () => ipcRenderer.invoke('desktop:skills'),
  fetchCatalog: (url) => ipcRenderer.invoke('desktop:catalog', url),
  chooseDir: () => ipcRenderer.invoke('desktop:choose-dir'),
  window: (action) => ipcRenderer.invoke('desktop:window', action),
  previewStart: (project) => ipcRenderer.invoke('desktop:preview-start', project),
  previewRestart: (project) => ipcRenderer.invoke('desktop:preview-restart', project),
  previewStop: () => ipcRenderer.invoke('desktop:preview-stop'),
  previewStatus: () => ipcRenderer.invoke('desktop:preview-status'),
  resetSettings: () => ipcRenderer.invoke('desktop:reset-settings'),
  onJobs: (fn) => {
    const wrapped = (_e, payload) => fn(payload);
    ipcRenderer.on('desktop:jobs', wrapped);
    return () => ipcRenderer.removeListener('desktop:jobs', wrapped);
  },
  onScanEvent: (fn) => {
    const wrapped = (_e, pack) => fn(pack && pack.type, pack && pack.payload);
    ipcRenderer.on('desktop:scan-event', wrapped);
    return () => ipcRenderer.removeListener('desktop:scan-event', wrapped);
  }
});
