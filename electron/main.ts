import crypto from 'node:crypto';
import path from 'node:path';
import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from 'electron';
import { StateStore, type GameInstance, type ViewMode } from './store';
import { ViewManager, type SlotBounds } from './viewManager';

// Flags anti-throttling para manter jogos idle 100% ativos em segundo plano
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let store: StateStore;
let viewManager: ViewManager | null = null;
let isQuitting = false;

function createTrayIcon() {
  // Ícone SVG minimalista em violeta convertido para NativeImage (16x16)
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
  tray.setToolTip('IdleNavigator — Jogos ativos em segundo plano');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir IdleNavigator',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
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
    width: 1400,
    height: 900,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: '#09090b',
    title: 'IdleNavigator',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  viewManager = new ViewManager(mainWindow, (id, state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('instance:runtime', { id, state });
    }
  });

  // Inicializa todas as instâncias salvas para já rodarem em segundo plano
  for (const instance of store.getState().instances) {
    viewManager.ensureView(instance);
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting && store.getState().minimizeToTray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    viewManager?.destroyAll();
    viewManager = null;
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

  ipcMain.handle(
    'instance:create',
    (_event, input: { name: string; url: string; autoReload?: boolean }) => {
      const instance: GameInstance = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        url: input.url.trim(),
        muted: false,
        zoomFactor: 1,
        autoReload: input.autoReload ?? true,
        createdAt: Date.now(),
      };

      store.setState((prev) => ({
        ...prev,
        instances: [...prev.instances, instance],
        activeInstanceId: instance.id,
      }));

      viewManager?.ensureView(instance);
      return instance;
    },
  );

  ipcMain.handle(
    'instance:update',
    (
      _event,
      input: {
        id: string;
        name?: string;
        url?: string;
        muted?: boolean;
        zoomFactor?: number;
        autoReload?: boolean;
      },
    ) => {
      let updated: GameInstance | null = null;
      let previousUrl: string | undefined;

      store.setState((prev) => ({
        ...prev,
        instances: prev.instances.map((item) => {
          if (item.id !== input.id) return item;
          previousUrl = item.url;
          updated = {
            ...item,
            name: input.name !== undefined ? input.name.trim() : item.name,
            url: input.url !== undefined ? input.url.trim() : item.url,
            muted: input.muted !== undefined ? input.muted : item.muted,
            zoomFactor: input.zoomFactor !== undefined ? input.zoomFactor : item.zoomFactor,
            autoReload: input.autoReload !== undefined ? input.autoReload : item.autoReload,
          };
          return updated;
        }),
      }));

      if (updated) {
        viewManager?.updateInstance(updated, previousUrl);
      }
      return updated;
    },
  );

  ipcMain.handle('instance:remove', (_event, id: string) => {
    const exists = store.getState().instances.some((item) => item.id === id);
    if (!exists) return false;

    store.setState((prev) => {
      const remaining = prev.instances.filter((item) => item.id !== id);
      const nextActive =
        prev.activeInstanceId === id ? (remaining[0]?.id ?? null) : prev.activeInstanceId;
      return {
        ...prev,
        instances: remaining,
        activeInstanceId: nextActive,
      };
    });

    viewManager?.removeView(id);
    return true;
  });

  ipcMain.handle('state:setActive', (_event, id: string | null) => {
    store.setState((prev) => ({ ...prev, activeInstanceId: id }));
  });

  ipcMain.handle('state:setViewMode', (_event, mode: ViewMode) => {
    store.setState((prev) => ({ ...prev, viewMode: mode }));
  });

  ipcMain.handle('state:setGridColumns', (_event, columns: 'auto' | 2 | 3) => {
    store.setState((prev) => ({ ...prev, gridColumns: columns }));
  });

  ipcMain.handle('state:setMinimizeToTray', (_event, enabled: boolean) => {
    store.setState((prev) => ({ ...prev, minimizeToTray: enabled }));
  });

  ipcMain.on('views:syncBounds', (_event, bounds: SlotBounds[]) => {
    viewManager?.syncBounds(bounds);
  });

  ipcMain.on('views:setOverlayHidden', (_event, hidden: boolean) => {
    viewManager?.setOverlayHidden(hidden);
  });

  ipcMain.handle('instance:reload', (_event, id: string) => {
    viewManager?.reload(id);
  });

  ipcMain.handle('instance:goBack', (_event, id: string) => {
    viewManager?.goBack(id);
  });

  ipcMain.handle('instance:openDevTools', (_event, id: string) => {
    viewManager?.openDevTools(id);
  });

  ipcMain.handle('instance:clearSession', async (_event, id: string) => {
    await viewManager?.clearSession(id);
  });
}

// Impede abrir duas instâncias do próprio app (mantém sessões integras)
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
