import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export type BrowserId = 'chrome' | 'edge' | 'brave';
export type GridColumnsPreference = 'auto' | 2 | 3;

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

const DEFAULT_STATE: AppState = {
  instances: [],
  preferredBrowser: null,
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
        instances: Array.isArray(parsed.instances)
          ? parsed.instances.map((item) => ({
              id: item.id,
              name: item.name,
              url: item.url,
              createdAt: item.createdAt ?? Date.now(),
            }))
          : [],
        preferredBrowser:
          parsed.preferredBrowser === 'chrome' ||
          parsed.preferredBrowser === 'edge' ||
          parsed.preferredBrowser === 'brave'
            ? parsed.preferredBrowser
            : null,
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
