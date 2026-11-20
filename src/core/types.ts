export type BrowserId = 'chrome' | 'edge' | 'brave';

export type GridColumnsPreference = 'auto' | 2 | 3;

export interface DetectedBrowser {
  id: BrowserId;
  name: string;
  executablePath: string;
}

export interface GameInstance {
  id: string;
  name: string;
  url: string;
  createdAt: number;
}

export interface AppState {
  instances: GameInstance[];
  preferredBrowser: BrowserId | null;
  gridColumns: GridColumnsPreference;
  minimizeToTray: boolean;
}

export interface CreateInstanceInput {
  name: string;
  url: string;
}

export interface UpdateInstanceInput {
  id: string;
  name?: string;
  url?: string;
}

export interface LaunchResult {
  ok: boolean;
  arrangedCount?: number;
  error?: string;
}

export interface IdleNavigatorApi {
  getState: () => Promise<AppState>;
  getBrowsers: () => Promise<DetectedBrowser[]>;
  createInstance: (input: CreateInstanceInput) => Promise<GameInstance>;
  updateInstance: (input: UpdateInstanceInput) => Promise<GameInstance | null>;
  removeInstance: (id: string) => Promise<boolean>;
  setPreferredBrowser: (browser: BrowserId) => Promise<void>;
  setGridColumns: (columns: GridColumnsPreference) => Promise<void>;
  setMinimizeToTray: (enabled: boolean) => Promise<void>;
  launchInstance: (id: string) => Promise<LaunchResult>;
  launchAllInGrid: () => Promise<LaunchResult>;
  arrangeGrid: () => Promise<LaunchResult>;
  clearSession: (id: string) => Promise<LaunchResult>;
}

declare global {
  interface Window {
    idleDock: IdleNavigatorApi;
  }
}
