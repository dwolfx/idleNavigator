import {
  Grid2x2,
  LayoutGrid,
  Monitor,
  Plus,
  Settings2,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { GameInstance, InstanceRuntimeState, ViewMode } from '../core/types';
import { extractHostname } from '../core/url';

interface SidebarProps {
  instances: GameInstance[];
  activeInstanceId: string | null;
  runtimeMap: Record<string, InstanceRuntimeState>;
  viewMode: ViewMode;
  gridColumns: 'auto' | 2 | 3;
  minimizeToTray: boolean;
  onSelectInstance: (id: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (instance: GameInstance) => void;
  onToggleMute: (instance: GameInstance) => void;
  onChangeViewMode: (mode: ViewMode) => void;
  onChangeGridColumns: (cols: 'auto' | 2 | 3) => void;
  onToggleMinimizeToTray: (enabled: boolean) => void;
}

function getStatusDotClass(status?: InstanceRuntimeState['status']): string {
  if (status === 'error' || status === 'crashed') return 'bg-status-error';
  if (status === 'loading') return 'bg-status-loading animate-pulse';
  return 'bg-status-ready';
}

export function Sidebar({
  instances,
  activeInstanceId,
  runtimeMap,
  viewMode,
  gridColumns,
  minimizeToTray,
  onSelectInstance,
  onOpenCreate,
  onOpenEdit,
  onToggleMute,
  onChangeViewMode,
  onChangeGridColumns,
  onToggleMinimizeToTray,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-elevated">
      {/* Marca */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
            <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-content-primary">IdleNavigator</h1>
            <p className="text-[11px] text-content-muted">Anti-throttling 24/7</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          title="Adicionar instância"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white transition hover:bg-accent-hover cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Modo de Visualização */}
      <div className="border-b border-border-subtle p-3 space-y-2">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-base p-1">
          <button
            type="button"
            onClick={() => onChangeViewMode('focus')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              viewMode === 'focus'
                ? 'bg-surface-overlay text-content-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Square className="h-3.5 w-3.5" strokeWidth={1.75} />
            Foco
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('grid')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-surface-overlay text-content-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Grid2x2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Grid
          </button>
        </div>

        {viewMode === 'grid' && (
          <div className="flex items-center justify-between px-1 text-[11px] text-content-secondary">
            <span>Colunas</span>
            <div className="flex gap-1">
              {(['auto', 2, 3] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChangeGridColumns(option)}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                    gridColumns === option
                      ? 'bg-accent text-white'
                      : 'bg-surface-base text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {option === 'auto' ? 'Auto' : `${option}x`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de Instâncias */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-content-muted">
            Instâncias ({instances.length})
          </span>
        </div>

        {instances.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-content-muted">
            Nenhuma instância ativa.
          </div>
        ) : (
          instances.map((instance) => {
            const runtime = runtimeMap[instance.id];
            const isActive = viewMode === 'focus' && activeInstanceId === instance.id;

            return (
              <div
                key={instance.id}
                onClick={() => onSelectInstance(instance.id)}
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-surface-hover text-content-primary ring-1 ring-border-strong'
                    : 'text-content-secondary hover:bg-surface-overlay hover:text-content-primary'
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${getStatusDotClass(runtime?.status)}`}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-content-primary">
                    {instance.name}
                  </p>
                  <p className="truncate text-[11px] text-content-muted">
                    {extractHostname(runtime?.currentUrl || instance.url)}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    title={instance.muted ? 'Ativar som' : 'Silenciar'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMute(instance);
                    }}
                    className="rounded p-1 text-content-secondary hover:bg-surface-base hover:text-content-primary cursor-pointer"
                  >
                    {instance.muted ? (
                      <VolumeX className="h-3.5 w-3.5 text-status-error" strokeWidth={1.75} />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Editar instância"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEdit(instance);
                    }}
                    className="rounded p-1 text-content-secondary hover:bg-surface-base hover:text-content-primary cursor-pointer"
                  >
                    <Settings2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rodapé / Bandeja */}
      <div className="border-t border-border-subtle p-3">
        <label className="flex items-center justify-between gap-2 text-xs text-content-secondary cursor-pointer">
          <span className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5 text-content-muted" strokeWidth={1.75} />
            Minimizar p/ bandeja
          </span>
          <input
            type="checkbox"
            checked={minimizeToTray}
            onChange={(e) => onToggleMinimizeToTray(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border-strong accent-accent cursor-pointer"
          />
        </label>
      </div>
    </aside>
  );
}
