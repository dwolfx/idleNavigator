import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('idleDock', {
  getState: () => ipcRenderer.invoke('state:get'),
  createInstance: (input: { name: string; url: string; autoReload?: boolean }) =>
    ipcRenderer.invoke('instance:create', input),
  updateInstance: (input: {
    id: string;
    name?: string;
    url?: string;
    muted?: boolean;
    zoomFactor?: number;
    autoReload?: boolean;
  }) => ipcRenderer.invoke('instance:update', input),
  removeInstance: (id: string) => ipcRenderer.invoke('instance:remove', id),
  setActiveInstance: (id: string | null) => ipcRenderer.invoke('state:setActive', id),
  setViewMode: (mode: 'focus' | 'grid') => ipcRenderer.invoke('state:setViewMode', mode),
  setGridColumns: (columns: 'auto' | 2 | 3) => ipcRenderer.invoke('state:setGridColumns', columns),
  setMinimizeToTray: (enabled: boolean) => ipcRenderer.invoke('state:setMinimizeToTray', enabled),
  syncBounds: (
    bounds: Array<{ id: string; x: number; y: number; width: number; height: number; visible: boolean }>,
  ) => ipcRenderer.send('views:syncBounds', bounds),
  setViewsOverlayHidden: (hidden: boolean) => ipcRenderer.send('views:setOverlayHidden', hidden),
  reloadInstance: (id: string) => ipcRenderer.invoke('instance:reload', id),
  goBackInstance: (id: string) => ipcRenderer.invoke('instance:goBack', id),
  openDevTools: (id: string) => ipcRenderer.invoke('instance:openDevTools', id),
  clearSession: (id: string) => ipcRenderer.invoke('instance:clearSession', id),
  onRuntimeUpdate: (callback: (payload: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => callback(payload);
    ipcRenderer.on('instance:runtime', listener);
    return () => ipcRenderer.removeListener('instance:runtime', listener);
  },
});
