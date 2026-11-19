import { BaseWindow, WebContentsView, session } from 'electron';
import type { GameInstance } from './store';

export interface SlotBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface InstanceRuntimeState {
  status: 'loading' | 'ready' | 'error' | 'crashed';
  currentUrl: string;
  title: string;
  isLoading: boolean;
}

type RuntimeListener = (id: string, state: InstanceRuntimeState) => void;

const AUTO_RELOAD_DELAY_MS = 5000;

function sanitizeUserAgent(rawUa: string): string {
  return rawUa
    .replace(/\s*Electron\/[\d.]+/g, '')
    .replace(/\s*idle-navigator\/[\d.]+/gi, '')
    .trim();
}

export class ViewManager {
  private readonly views = new Map<string, WebContentsView>();
  private readonly reloadTimers = new Map<string, NodeJS.Timeout>();
  private readonly autoReloadMap = new Map<string, boolean>();
  private readonly lastBounds = new Map<string, SlotBounds>();
  private overlayHidden = false;

  constructor(
    private readonly win: BaseWindow,
    private readonly onRuntimeUpdate: RuntimeListener,
  ) {}

  ensureView(instance: GameInstance): WebContentsView {
    const existing = this.views.get(instance.id);
    if (existing) {
      this.autoReloadMap.set(instance.id, instance.autoReload);
      existing.webContents.setAudioMuted(instance.muted);
      existing.webContents.setZoomFactor(instance.zoomFactor);
      return existing;
    }

    const partitionName = `persist:instance-${instance.id}`;
    const instanceSession = session.fromPartition(partitionName);
    const cleanUa = sanitizeUserAgent(instanceSession.getUserAgent());
    instanceSession.setUserAgent(cleanUa);

    const view = new WebContentsView({
      webPreferences: {
        partition: partitionName,
        backgroundThrottling: false,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    this.views.set(instance.id, view);
    this.autoReloadMap.set(instance.id, instance.autoReload);

    view.setVisible(false);
    this.win.contentView.addChildView(view);

    const wc = view.webContents;
    wc.setUserAgent(cleanUa);
    wc.setAudioMuted(instance.muted);
    wc.setZoomFactor(instance.zoomFactor);

    // Permite popups de autenticação (Google/Discord/etc.) na mesma sessão isolada
    wc.setWindowOpenHandler(() => ({
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 520,
        height: 680,
        autoHideMenuBar: true,
        webPreferences: {
          partition: partitionName,
          backgroundThrottling: false,
          contextIsolation: true,
          nodeIntegration: false,
        },
      },
    }));

    const emitState = (status: InstanceRuntimeState['status'], isLoading: boolean) => {
      if (wc.isDestroyed()) return;
      this.onRuntimeUpdate(instance.id, {
        status,
        currentUrl: wc.getURL() || instance.url,
        title: wc.getTitle() || instance.name,
        isLoading,
      });
    };

    const scheduleAutoReload = () => {
      if (!this.autoReloadMap.get(instance.id)) return;
      if (this.reloadTimers.has(instance.id)) return;

      const timer = setTimeout(() => {
        this.reloadTimers.delete(instance.id);
        if (!wc.isDestroyed()) {
          wc.reload();
        }
      }, AUTO_RELOAD_DELAY_MS);

      this.reloadTimers.set(instance.id, timer);
    };

    const clearReloadTimer = () => {
      const timer = this.reloadTimers.get(instance.id);
      if (timer) {
        clearTimeout(timer);
        this.reloadTimers.delete(instance.id);
      }
    };

    wc.on('did-start-loading', () => emitState('loading', true));
    wc.on('did-stop-loading', () => {
      clearReloadTimer();
      emitState('ready', false);
    });
    wc.on('page-title-updated', () => emitState('ready', wc.isLoading()));
    wc.on('did-fail-load', (_event, errorCode, _desc, _url, isMainFrame) => {
      // -3 = ERR_ABORTED (navegação cancelada normalmente)
      if (!isMainFrame || errorCode === -3) return;
      emitState('error', false);
      scheduleAutoReload();
    });
    wc.on('render-process-gone', () => {
      emitState('crashed', false);
      scheduleAutoReload();
    });

    void wc.loadURL(instance.url);
    return view;
  }

  updateInstance(instance: GameInstance, previousUrl?: string): void {
    const view = this.ensureView(instance);
    this.autoReloadMap.set(instance.id, instance.autoReload);
    view.webContents.setAudioMuted(instance.muted);
    view.webContents.setZoomFactor(instance.zoomFactor);

    if (previousUrl && previousUrl !== instance.url) {
      void view.webContents.loadURL(instance.url);
    }
  }

  removeView(id: string): void {
    const timer = this.reloadTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.reloadTimers.delete(id);
    }
    this.autoReloadMap.delete(id);
    this.lastBounds.delete(id);

    const view = this.views.get(id);
    if (!view) return;

    this.win.contentView.removeChildView(view);
    if (!view.webContents.isDestroyed()) {
      view.webContents.close({ waitForBeforeUnload: false });
    }
    this.views.delete(id);
  }

  syncBounds(boundsList: SlotBounds[]): void {
    const visibleIds = new Set<string>();

    for (const item of boundsList) {
      this.lastBounds.set(item.id, item);
      const view = this.views.get(item.id);
      if (!view) continue;

      if (this.overlayHidden || !item.visible || item.width <= 0 || item.height <= 0) {
        view.setVisible(false);
        continue;
      }

      visibleIds.add(item.id);
      view.setBounds({
        x: Math.round(item.x),
        y: Math.round(item.y),
        width: Math.round(item.width),
        height: Math.round(item.height),
      });
      view.setVisible(true);
    }

    for (const [id, view] of this.views.entries()) {
      if (!visibleIds.has(id)) {
        view.setVisible(false);
      }
    }
  }

  setOverlayHidden(hidden: boolean): void {
    this.overlayHidden = hidden;
    this.syncBounds(Array.from(this.lastBounds.values()));
  }

  reload(id: string): void {
    const view = this.views.get(id);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.reload();
    }
  }

  goBack(id: string): void {
    const view = this.views.get(id);
    if (view && !view.webContents.isDestroyed() && view.webContents.navigationHistory.canGoBack()) {
      view.webContents.navigationHistory.goBack();
    }
  }

  openDevTools(id: string): void {
    const view = this.views.get(id);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.openDevTools({ mode: 'detach' });
    }
  }

  async clearSession(id: string): Promise<void> {
    const partitionName = `persist:instance-${id}`;
    const instanceSession = session.fromPartition(partitionName);
    await instanceSession.clearStorageData();
    await instanceSession.clearCache();
    this.reload(id);
  }

  destroyAll(): void {
    for (const id of Array.from(this.views.keys())) {
      this.removeView(id);
    }
  }
}
