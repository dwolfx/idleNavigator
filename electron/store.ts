import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export type ViewMode = 'focus' | 'grid';

export interface GameInstance {
  id: string;
  name: string;
  url: string;
  muted: boolean;
  zoomFactor: number;
  autoReload: boolean;
  createdAt: number;
}

export interface AppState {
  instances: GameInstance[];
  activeInstanceId: string | null;
  viewMode: ViewMode;
  gridColumns: 'auto' | 2 | 3;
  minimizeToTray: boolean;
}

const DEFAULT_STATE: AppState = {
  instances: [],
  activeInstanceId: null,
  viewMode: 'focus',
  gridColumns: 'auto',
  minimizeToTray: true,
};

export class StateStore {
  private readonly filePath: string;
  private state: AppState;

  constructor(customPath?: string) {
    this.filePath = customPath ?? path.join(app.getPath('userData'), 'idle-navigator-state.json');
    this.state = this.load();
  }

  private load(): AppState {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { ...DEFAULT_STATE };
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        instances: Array.isArray(parsed.instances) ? parsed.instances : [],
        activeInstanceId: parsed.activeInstanceId ?? null,
        viewMode: parsed.viewMode === 'grid' ? 'grid' : 'focus',
        gridColumns:
          parsed.gridColumns === 2 || parsed.gridColumns === 3 ? parsed.gridColumns : 'auto',
        minimizeToTray: parsed.minimizeToTray ?? true,
      };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  private save(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  getState(): AppState {
    return this.state;
  }

  setState(updater: (prev: AppState) => AppState): AppState {
    this.state = updater(this.state);
    this.save();
    return this.state;
  }
}
