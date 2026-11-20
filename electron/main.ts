import crypto from 'node:crypto';
import path from 'node:path';
import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from 'electron';
import { BrowserLauncher, detectInstalledBrowsers } from './browserLauncher';
import { StateStore, type BrowserId, type GameInstance, type GridColumnsPreference } from './store';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let store: StateStore;
const launcher = new BrowserLauncher();
let isQuitting = false;

function createTrayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#7c3aed"/>
    <rect x="7" y="7" width="8" height="8" rx="2" fill="#ffffff"/>
    <rect x="17" y="7" width="8" height="8" rx="2" fill="#ddd6fe"/>
    <rect x="7" y="17" width="8" height="8" rx="2" fill="#ddd6fe"/>
    <rect x="17" y="17" width="8" height="8" rx="2" fill="#ffffff"/>
  </svg>`;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return nativeImage.createFromDataURL(dataUrl).resize({ width: 16, height: 16 });
}

function setupTray() {
  if (tray) return;
  tray = new Tray(createTrayIcon());
  tray.setToolTip('IdleNavigator — Painel de instâncias');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir IdleNavigator',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Abrir todas em Grid',
      click: () => {
        const state = store.getState();
        launcher.launchAllInGrid(state.instances, state.preferredBrowser, state.gridColumns);
      },
    },
    {
      label: 'Organizar janelas em Grid',
      click: () => {
        const state = store.getState();
        void launcher.arrangeInGrid(state.preferredBrowser, state.gridColumns);
      },
    },
    { type: 'separator' },
    {
      label: 'Sair de verdade',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 660,
    minWidth: 720,
    minHeight: 500,
    backgroundColor: '#09090b',
    title: 'IdleNavigator',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && store.getState().minimizeToTray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function registerIpcHandlers() {
  ipcMain.handle('state:get', () => store.getState());
  ipcMain.handle('browsers:list', () => detectInstalledBrowsers());

  ipcMain.handle('instance:create', (_event, input: { name: string; url: string }) => {
    const instance: GameInstance = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      url: input.url.trim(),
      createdAt: Date.now(),
    };

    store.setState((prev) => ({
      ...prev,
      instances: [...prev.instances, instance],
    }));

    return instance;
  });

  ipcMain.handle(
    'instance:update',
    (_event, input: { id: string; name?: string; url?: string }) => {
      let updated: GameInstance | null = null;

      store.setState((prev) => ({
        ...prev,
        instances: prev.instances.map((item) => {
          if (item.id !== input.id) return item;
          updated = {
            ...item,
            name: input.name !== undefined ? input.name.trim() : item.name,
            url: input.url !== undefined ? input.url.trim() : item.url,
          };
          return updated;
        }),
      }));

      return updated;
    },
  );

  ipcMain.handle('instance:remove', (_event, id: string) => {
    const exists = store.getState().instances.some((item) => item.id === id);
    if (!exists) return false;

    store.setState((prev) => ({
      ...prev,
      instances: prev.instances.filter((item) => item.id !== id),
    }));

    return true;
  });

  ipcMain.handle('state:setPreferredBrowser', (_event, browser: BrowserId) => {
    store.setState((prev) => ({ ...prev, preferredBrowser: browser }));
  });

  ipcMain.handle('state:setGridColumns', (_event, columns: GridColumnsPreference) => {
    store.setState((prev) => ({ ...prev, gridColumns: columns }));
  });

  ipcMain.handle('state:setMinimizeToTray', (_event, enabled: boolean) => {
    store.setState((prev) => ({ ...prev, minimizeToTray: enabled }));
  });

  ipcMain.handle('instance:launch', (_event, id: string) => {
    const state = store.getState();
    const target = state.instances.find((item) => item.id === id);
    if (!target) return { ok: false, error: 'Instância não encontrada.' };
    return launcher.launchInstance(target, state.preferredBrowser);
  });

  ipcMain.handle('instance:launchAllInGrid', () => {
    const state = store.getState();
    return launcher.launchAllInGrid(state.instances, state.preferredBrowser, state.gridColumns);
  });

  ipcMain.handle('windows:arrangeGrid', () => {
    const state = store.getState();
    return launcher.arrangeInGrid(state.preferredBrowser, state.gridColumns);
  });

  ipcMain.handle('instance:clearSession', (_event, id: string) => {
    const state = store.getState();
    return launcher.clearSession(id, state.preferredBrowser);
  });
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    store = new StateStore();
    registerIpcHandlers();
    setupTray();
    createMainWindow();
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
