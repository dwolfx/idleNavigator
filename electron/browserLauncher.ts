import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { app, screen } from 'electron';
import type { BrowserId, GameInstance, GridColumnsPreference } from './store';

export interface DetectedBrowser {
  id: BrowserId;
  name: string;
  executablePath: string;
}

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BrowserCandidate {
  id: BrowserId;
  name: string;
  paths: string[];
}

function getBrowserCandidates(): BrowserCandidate[] {
  const pf = process.env.ProgramFiles ?? 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
  const local = process.env.LOCALAPPDATA ?? '';

  return [
    {
      id: 'chrome',
      name: 'Google Chrome',
      paths: [
        path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ],
    },
    {
      id: 'edge',
      name: 'Microsoft Edge',
      paths: [
        path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      ],
    },
    {
      id: 'brave',
      name: 'Brave',
      paths: [
        path.join(pf, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
        path.join(local, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      ],
    },
  ];
}

export function detectInstalledBrowsers(): DetectedBrowser[] {
  const detected: DetectedBrowser[] = [];

  for (const candidate of getBrowserCandidates()) {
    const foundPath = candidate.paths.find((p) => p && fs.existsSync(p));
    if (foundPath) {
      detected.push({
        id: candidate.id,
        name: candidate.name,
        executablePath: foundPath,
      });
    }
  }

  return detected;
}

function getUserDataRoot(browserId: BrowserId): string {
  return path.join(app.getPath('userData'), 'browser-profiles', browserId);
}

function getProfileDirectoryName(instanceId: string): string {
  return `slot-${instanceId}`;
}

export function buildLaunchArgs(
  instance: GameInstance,
  userDataDir: string,
  rect?: WindowRect,
): string[] {
  const args = [
    `--user-data-dir=${userDataDir}`,
    `--profile-directory=${getProfileDirectoryName(instance.id)}`,
    `--app=${instance.url}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ];

  if (rect) {
    args.push(`--window-position=${Math.round(rect.x)},${Math.round(rect.y)}`);
    args.push(`--window-size=${Math.round(rect.width)},${Math.round(rect.height)}`);
  }

  return args;
}

function resolveGridRects(count: number, preference: GridColumnsPreference): WindowRect[] {
  if (count <= 0) return [];
  const workArea = screen.getPrimaryDisplay().workArea;
  const cols =
    count <= 1
      ? 1
      : preference === 2
        ? 2
        : preference === 3
          ? count === 2
            ? 2
            : 3
          : count <= 4
            ? 2
            : 3;

  const rows = Math.ceil(count / cols);
  const cellWidth = Math.floor(workArea.width / cols);
  const cellHeight = Math.floor(workArea.height / rows);

  return Array.from({ length: count }, (_, i) => ({
    x: workArea.x + (i % cols) * cellWidth,
    y: workArea.y + Math.floor(i / cols) * cellHeight,
    width: cellWidth,
    height: cellHeight,
  }));
}

export class BrowserLauncher {
  resolveBrowser(preferred: BrowserId | null): DetectedBrowser | null {
    const installed = detectInstalledBrowsers();
    if (installed.length === 0) return null;
    if (preferred) {
      const exact = installed.find((b) => b.id === preferred);
      if (exact) return exact;
    }
    return installed[0];
  }

  launchInstance(
    instance: GameInstance,
    preferred: BrowserId | null,
    rect?: WindowRect,
  ): { ok: boolean; error?: string } {
    const browser = this.resolveBrowser(preferred);
    if (!browser) {
      return {
        ok: false,
        error: 'Nenhum navegador Chromium (Chrome, Edge ou Brave) encontrado no sistema.',
      };
    }

    const userDataDir = getUserDataRoot(browser.id);
    fs.mkdirSync(userDataDir, { recursive: true });

    const args = buildLaunchArgs(instance, userDataDir, rect);
    const child = spawn(browser.executablePath, args, {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    return { ok: true };
  }

  launchAllInGrid(
    instances: GameInstance[],
    preferred: BrowserId | null,
    gridColumns: GridColumnsPreference,
  ): { ok: boolean; error?: string } {
    if (instances.length === 0) {
      return { ok: false, error: 'Nenhuma instância cadastrada.' };
    }

    const rects = resolveGridRects(instances.length, gridColumns);

    // Pequeno intervalo entre os spawns evita race condition na inicialização do perfil compartilhado
    instances.forEach((instance, index) => {
      setTimeout(() => {
        this.launchInstance(instance, preferred, rects[index]);
      }, index * 350);
    });

    return { ok: true };
  }

  clearSession(instanceId: string, preferred: BrowserId | null): { ok: boolean; error?: string } {
    const browser = this.resolveBrowser(preferred);
    if (!browser) {
      return { ok: false, error: 'Navegador não encontrado.' };
    }

    const profilePath = path.join(getUserDataRoot(browser.id), getProfileDirectoryName(instanceId));
    try {
      if (fs.existsSync(profilePath)) {
        fs.rmSync(profilePath, { recursive: true, force: true });
      }
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Feche a janela deste jogo antes de limpar a sessão.',
      };
    }
  }
}
