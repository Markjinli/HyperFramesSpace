const { app, BrowserWindow, ipcMain, protocol, net, dialog, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');
const store = require('./lib/store.cjs');
const scan = require('./lib/scan.cjs');
const processes = require('./lib/processes.cjs');
const jobs = require('./lib/jobs.cjs');
const doctor = require('./lib/doctor.cjs');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'framespace',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

let mainWindow = null;

function settingsDir() {
  return app.getPath('userData');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#0a0d12',
    frame: false,
    show: false,
    title: 'Framespace',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

function sendJobs() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('desktop:jobs', jobs.list());
  }
}

app.whenReady().then(() => {
  protocol.handle('framespace', async (request) => {
    try {
      const url = new URL(request.url);
      const filePath = url.searchParams.get('p') || '';
      if (!filePath || !path.isAbsolute(filePath) || !fs.existsSync(filePath)) {
        return new Response('not found', { status: 404 });
      }
      return net.fetch(pathToFileURL(filePath).href);
    } catch (err) {
      return new Response(String(err.message || err), { status: 500 });
    }
  });

  jobs.setListener(sendJobs);
  createWindow();
});

app.on('window-all-closed', () => app.quit());

ipcMain.handle('desktop:get-settings', () => store.load(settingsDir()));
ipcMain.handle('desktop:save-settings', (_e, patch) => store.save(settingsDir(), patch || {}));

ipcMain.handle('desktop:scan', (_e, roots) => {
  const settings = store.load(settingsDir());
  const list = Array.isArray(roots) && roots.length ? roots : settings.scanRoots;
  return scan.scanRoots(list, { latestPin: settings.latestPin, maxDepth: 6 });
});

ipcMain.handle('desktop:processes', async () => {
  const list = await processes.listProcesses();
  return { processes: list, host: processes.hostResources(), load: processes.occupancy(list) };
});

ipcMain.handle('desktop:kill', async (_e, pids) => processes.killPids(pids));
ipcMain.handle('desktop:jobs', () => jobs.list());
ipcMain.handle('desktop:run-job', (_e, spec) => jobs.startJob(spec || {}));

ipcMain.handle('desktop:open-agent', (_e, spec) => {
  spec = spec || {};
  const settings = store.load(settingsDir());
  const command = jobs.openAgent(spec.agent || settings.defaultAgent, spec.project, settings.terminal);
  return { command };
});

ipcMain.handle('desktop:open-path', async (_e, target) => {
  if (!target) return { ok: false };
  await shell.openPath(String(target));
  return { ok: true };
});

ipcMain.handle('desktop:reveal', (_e, target) => {
  if (!target) return { ok: false };
  shell.showItemInFolder(String(target));
  return { ok: true };
});

ipcMain.handle('desktop:doctor', async (_e, projects) => {
  const info = await doctor.inspect(projects || []);
  if (info.latestPin) store.save(settingsDir(), { latestPin: info.latestPin });
  return info;
});

ipcMain.handle('desktop:skills', () => doctor.listSkills());
ipcMain.handle('desktop:catalog', (_e, url) => doctor.fetchCatalog(url));

ipcMain.handle('desktop:choose-dir', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: '选择扫描根目录',
    properties: ['openDirectory']
  });
  if (res.canceled || !res.filePaths[0]) return null;
  return res.filePaths[0];
});

ipcMain.handle('desktop:window', (_e, action) => {
  if (!mainWindow) return false;
  if (action === 'min') mainWindow.minimize();
  else if (action === 'max') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  } else if (action === 'close') mainWindow.close();
  return true;
});