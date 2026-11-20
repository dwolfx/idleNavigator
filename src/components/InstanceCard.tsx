import { Eraser, ExternalLink, Globe, Pencil, Trash2 } from 'lucide-react';
import type { GameInstance } from '../core/types';
import { extractHostname } from '../core/url';

interface InstanceCardProps {
  instance: GameInstance;
  index: number;
  onLaunch: () => void;
  onEdit: () => void;
  onClearSession: () => void;
  onRemove: () => void;
}

export function InstanceCard({
  instance,
  index,
  onLaunch,
  onEdit,
  onClearSession,
  onRemove,
}: InstanceCardProps) {
  return (
    <article className="group flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-elevated p-4 transition hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-overlay text-accent-hover ring-1 ring-border-subtle">
            <Globe className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-content-primary">{instance.name}</h3>
            <p className="truncate text-xs text-content-muted">{extractHostname(instance.url)}</p>
          </div>
        </div>

        <span className="shrink-0 rounded-md bg-surface-base px-2 py-0.5 font-mono text-[11px] text-content-muted ring-1 ring-border-subtle">
          #{index + 1}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
        <button
          type="button"
          onClick={onLaunch}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover cursor-pointer"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          Abrir jogo
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Editar nome ou URL"
            onClick={onEdit}
            className="rounded-md p-1.5 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            title="Limpar sessão e cookies (forçar logout)"
            onClick={onClearSession}
            className="rounded-md p-1.5 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
          >
            <Eraser className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            title="Remover instância"
            onClick={onRemove}
            className="rounded-md p-1.5 text-content-secondary transition hover:bg-status-error/20 hover:text-status-error cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </article>
  );
}
