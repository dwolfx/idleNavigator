import {
  ArrowLeft,
  Eraser,
  Maximize2,
  Pencil,
  RotateCw,
  Terminal,
  Trash2,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { clampZoomFactor } from '../core/layout';
import type { GameInstance, InstanceRuntimeState, ViewMode } from '../core/types';
import { extractHostname } from '../core/url';

interface SlotHeaderProps {
  instance: GameInstance;
  runtime?: InstanceRuntimeState;
  viewMode: ViewMode;
  onGoBack: () => void;
  onReload: () => void;
  onToggleMute: () => void;
  onChangeZoom: (nextZoom: number) => void;
  onFocus: () => void;
  onEdit: () => void;
  onOpenDevTools: () => void;
  onClearSession: () => void;
  onRemove: () => void;
}

export function SlotHeader({
  instance,
  runtime,
  viewMode,
  onGoBack,
  onReload,
  onToggleMute,
  onChangeZoom,
  onFocus,
  onEdit,
  onOpenDevTools,
  onClearSession,
  onRemove,
}: SlotHeaderProps) {
  const zoomPercent = Math.round(instance.zoomFactor * 100);
  const statusColor =
    runtime?.status === 'error' || runtime?.status === 'crashed'
      ? 'bg-status-error'
      : runtime?.isLoading
        ? 'bg-status-loading animate-pulse'
        : 'bg-status-ready';

  return (
    <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-surface-elevated px-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor}`} />
        <span className="truncate text-xs font-medium text-content-primary">{instance.name}</span>
        <span className="hidden truncate text-[11px] text-content-muted sm:inline">
          {extractHostname(runtime?.currentUrl || instance.url)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          title="Voltar"
          onClick={onGoBack}
          className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          title="Recarregar"
          onClick={onReload}
          className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          <RotateCw
            className={`h-3.5 w-3.5 ${runtime?.isLoading ? 'animate-spin' : ''}`}
            strokeWidth={1.75}
          />
        </button>

        <button
          type="button"
          title={instance.muted ? 'Ativar áudio' : 'Silenciar áudio'}
          onClick={onToggleMute}
          className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          {instance.muted ? (
            <VolumeX className="h-3.5 w-3.5 text-status-error" strokeWidth={1.75} />
          ) : (
            <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
        </button>

        <div className="mx-1 h-3.5 w-px bg-border-subtle" />

        <button
          type="button"
          title="Diminuir zoom"
          onClick={() => onChangeZoom(clampZoomFactor(instance.zoomFactor - 0.1))}
          className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          <ZoomOut className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          title="Resetar zoom para 100%"
          onClick={() => onChangeZoom(1)}
          className="rounded px-1 py-0.5 text-[11px] font-mono text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          {zoomPercent}%
        </button>

        <button
          type="button"
          title="Aumentar zoom"
          onClick={() => onChangeZoom(clampZoomFactor(instance.zoomFactor + 0.1))}
          className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>

        <div className="mx-1 h-3.5 w-px bg-border-subtle" />

        {viewMode === 'grid' && (
          <button
            type="button"
            title="Focar nesta instância"
            onClick={onFocus}
            className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        )}

        <button
          type="button"
          title="Editar nome/URL"
          onClick={onEdit}
          className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          title="Limpar sessão e cookies (forçar logout)"
          onClick={onClearSession}
          className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          <Eraser className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          title="Abrir DevTools"
          onClick={onOpenDevTools}
          className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
        >
          <Terminal className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          title="Remover instância"
          onClick={onRemove}
          className="rounded p-1 text-content-secondary transition hover:bg-status-error/20 hover:text-status-error cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
