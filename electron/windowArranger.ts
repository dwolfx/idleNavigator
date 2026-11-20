import { execFile } from 'node:child_process';
import { screen } from 'electron';
import type { GridColumnsPreference } from './store';

export interface ArrangeResult {
  ok: boolean;
  arrangedCount?: number;
  error?: string;
}

function resolveGridColumns(count: number, preference: GridColumnsPreference): 1 | 2 | 3 {
  if (count <= 1) return 1;
  if (preference === 2) return 2;
  if (preference === 3) return count === 2 ? 2 : 3;
  return count <= 4 ? 2 : 3;
}

/**
 * Organiza todas as janelas visíveis do navegador pertencentes ao userDataDir exclusivo
 * do IdleNavigator em um Grid exato na área útil do monitor principal (Win32 SetWindowPos).
 */
export function arrangeBrowserWindowsInGrid(
  userDataDir: string,
  gridColumns: GridColumnsPreference,
): Promise<ArrangeResult> {
  if (process.platform !== 'win32') {
    return Promise.resolve({
      ok: false,
      error: 'Organização automática de janelas está disponível apenas no Windows.',
    });
  }

  const display = screen.getPrimaryDisplay();
  const scale = display.scaleFactor || 1;
  const workX = Math.round(display.workArea.x * scale);
  const workY = Math.round(display.workArea.y * scale);
  const workW = Math.round(display.workArea.width * scale);
  const workH = Math.round(display.workArea.height * scale);

  const escapedDir = userDataDir.replace(/'/g, "''");
  const prefStr = String(gridColumns);

  const psScript = `
$ErrorActionPreference = 'Stop'
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class IdleWin32 {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

  public static List<IntPtr> GetWindowsForPids(HashSet<uint> pids) {
    var result = new List<IntPtr>();
    EnumWindows((hWnd, lParam) => {
      if (!IsWindowVisible(hWnd)) return true;
      if (GetWindowTextLength(hWnd) == 0) return true;
      uint pid;
      GetWindowThreadProcessId(hWnd, out pid);
      if (pids.Contains(pid)) {
        result.Add(hWnd);
      }
      return true;
    }, IntPtr.Zero);
    return result;
  }
}
"@

[IdleWin32]::SetProcessDPIAware() | Out-Null

$targetDir = '${escapedDir}'.ToLowerInvariant()
$procs = Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and $_.CommandLine.ToLowerInvariant().Contains($targetDir)
}

$pidSet = New-Object 'System.Collections.Generic.HashSet[uint32]'
foreach ($p in $procs) {
  [void]$pidSet.Add([uint32]$p.ProcessId)
}

if ($pidSet.Count -eq 0) {
  Write-Output 'COUNT:0'
  exit 0
}

$windows = [IdleWin32]::GetWindowsForPids($pidSet)
$count = $windows.Count
if ($count -eq 0) {
  Write-Output 'COUNT:0'
  exit 0
}

$pref = '${prefStr}'
if ($count -le 1) { $cols = 1 }
elseif ($pref -eq '2') { $cols = 2 }
elseif ($pref -eq '3') { if ($count -eq 2) { $cols = 2 } else { $cols = 3 } }
else { if ($count -le 4) { $cols = 2 } else { $cols = 3 } }

$rows = [int][Math]::Ceiling($count / [double]$cols)
$cellW = [int][Math]::Floor(${workW} / $cols)
$cellH = [int][Math]::Floor(${workH} / $rows)

# SW_RESTORE = 9; SWP_NOZORDER = 0x0004; SWP_SHOWWINDOW = 0x0040
for ($i = 0; $i -lt $count; $i++) {
  $col = $i % $cols
  $row = [int][Math]::Floor($i / $cols)
  $x = ${workX} + ($col * $cellW)
  $y = ${workY} + ($row * $cellH)
  $hwnd = $windows[$i]
  [IdleWin32]::ShowWindow($hwnd, 9) | Out-Null
  [IdleWin32]::SetWindowPos($hwnd, [IntPtr]::Zero, $x, $y, $cellW, $cellH, 0x0040) | Out-Null
}

Write-Output "COUNT:$count"
`;

  // Mantém a função resolveGridColumns usada para consistência de tipos (TS)
  void resolveGridColumns;

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', psScript],
      { windowsHide: true, timeout: 10000 },
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            ok: false,
            error: stderr?.trim() || 'Não foi possível organizar as janelas automaticamente.',
          });
          return;
        }
        const match = /COUNT:(\d+)/.exec(stdout);
        const arrangedCount = match ? Number(match[1]) : 0;
        if (arrangedCount === 0) {
          resolve({
            ok: false,
            error: 'Nenhuma janela aberta pelo IdleNavigator encontrada para organizar.',
          });
          return;
        }
        resolve({ ok: true, arrangedCount });
      },
    );
  });
}
