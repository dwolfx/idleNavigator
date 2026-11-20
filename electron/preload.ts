import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('idleDock', {
  getState: () => ipcRenderer.invoke('state:get'),
  getBrowsers: () => ipcRenderer.invoke('browsers:list'),
  createInstance: (input: { name: string; url: string }) =>
    ipcRenderer.invoke('instance:create', input),
  updateInstance: (input: { id: string; name?: string; url?: string }) =>
    ipcRenderer.invoke('instance:update', input),
  removeInstance: (id: string) => ipcRenderer.invoke('instance:remove', id),
  setPreferredBrowser: (browser: 'chrome' | 'edge' | 'brave') =>
    ipcRenderer.invoke('state:setPreferredBrowser', browser),
  setGridColumns: (columns: 'auto' | 2 | 3) => ipcRenderer.invoke('state:setGridColumns', columns),
  setMinimizeToTray: (enabled: boolean) => ipcRenderer.invoke('state:setMinimizeToTray', enabled),
  launchInstance: (id: string) => ipcRenderer.invoke('instance:launch', id),
  launchAllInGrid: () => ipcRenderer.invoke('instance:launchAllInGrid'),
  arrangeGrid: () => ipcRenderer.invoke('windows:arrangeGrid'),
  clearSession: (id: string) => ipcRenderer.invoke('instance:clearSession', id),
});
