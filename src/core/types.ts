export type ViewMode = 'focus' | 'grid';

export type InstanceStatus = 'loading' | 'ready' | 'error' | 'crashed';

export interface GameInstance {
  id: string;
  name: string;
  url: string;
  muted: boolean;
  zoomFactor: number;
  autoReload: boolean;
  createdAt: number;
}

export interface InstanceRuntimeState {
  status: InstanceStatus;
  currentUrl: string;
  title: string;
  isLoading: boolean;
}

export interface SlotBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface AppState {
  instances: GameInstance[];
  activeInstanceId: string | null;
  viewMode: ViewMode;
  gridColumns: 'auto' | 2 | 3;
  minimizeToTray: boolean;
}

export interface CreateInstanceInput {
  name: string;
  url: string;
  autoReload?: boolean;
}

export interface UpdateInstanceInput {
  id: string;
  name?: string;
  url?: string;
  muted?: boolean;
  zoomFactor?: number;
  autoReload?: boolean;
}

export interface IdleDockApi {
  getState: () => Promise<AppState>;
  createInstance: (input: CreateInstanceInput) => Promise<GameInstance>;
  updateInstance: (input: UpdateInstanceInput) => Promise<GameInstance | null>;
  removeInstance: (id: string) => Promise<boolean>;
  setActiveInstance: (id: string | null) => Promise<void>;
  setViewMode: (mode: ViewMode) => Promise<void>;
  setGridColumns: (columns: 'auto' | 2 | 3) => Promise<void>;
  setMinimizeToTray: (enabled: boolean) => Promise<void>;
  syncBounds: (bounds: SlotBounds[]) => void;
  setViewsOverlayHidden: (hidden: boolean) => void;
  reloadInstance: (id: string) => Promise<void>;
  goBackInstance: (id: string) => Promise<void>;
  openDevTools: (id: string) => Promise<void>;
  clearSession: (id: string) => Promise<void>;
  onRuntimeUpdate: (
    callback: (payload: { id: string; state: InstanceRuntimeState }) => void,
  ) => () => void;
}

declare global {
  interface Window {
    idleDock: IdleDockApi;
  }
}
