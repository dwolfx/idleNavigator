import { useCallback, useEffect, useRef } from 'react';
import { Gamepad2, Plus } from 'lucide-react';
import { resolveGridColumns, type GridColumnsPreference } from '../core/layout';
import type { GameInstance, InstanceRuntimeState, SlotBounds, ViewMode } from '../core/types';
import { SlotHeader } from './SlotHeader';

interface ViewportAreaProps {
  instances: GameInstance[];
  activeInstanceId: string | null;
  runtimeMap: Record<string, InstanceRuntimeState>;
  viewMode: ViewMode;
  gridColumns: GridColumnsPreference;
  onOpenCreate: () => void;
  onFocusInstance: (id: string) => void;
  onEditInstance: (instance: GameInstance) => void;
  onUpdateInstance: (
    id: string,
    patch: Partial<Pick<GameInstance, 'muted' | 'zoomFactor'>>,
  ) => void;
  onRemoveInstance: (id: string) => void;
}

const GRID_COLS_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

export function ViewportArea({
  instances,
  activeInstanceId,
  runtimeMap,
  viewMode,
  gridColumns,
  onOpenCreate,
  onFocusInstance,
  onEditInstance,
  onUpdateInstance,
  onRemoveInstance,
}: ViewportAreaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const visibleInstances =
    viewMode === 'grid'
      ? instances
      : instances.filter((item) => item.id === (activeInstanceId ?? instances[0]?.id));

  const syncAllBounds = useCallback(() => {
    if (!window.idleDock) return;

    const bounds: SlotBounds[] = instances.map((instance) => {
      const el = slotRefs.current.get(instance.id);
      const isVisible = visibleInstances.some((v) => v.id === instance.id);

      if (!el || !isVisible) {
        return { id: instance.id, x: 0, y: 0, width: 0, height: 0, visible: false };
      }

      const rect = el.getBoundingClientRect();
      return {
        id: instance.id,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0,
      };
    });

    window.idleDock.syncBounds(bounds);
  }, [instances, visibleInstances]);

  useEffect(() => {
    const raf = requestAnimationFrame(syncAllBounds);
    const observer = new ResizeObserver(syncAllBounds);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', syncAllBounds);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', syncAllBounds);
    };
  }, [syncAllBounds, viewMode, gridColumns, instances.length]);

  if (instances.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-surface-base p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated ring-1 ring-border-subtle">
          <Gamepad2 className="h-7 w-7 text-accent-hover" strokeWidth={1.75} />
        </div>
        <h2 className="text-base font-semibold text-content-primary">
          Seus jogos idle, sem dormir em segundo plano
        </h2>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-content-secondary">
          Cada instância tem sessão e login totalmente isolados e persistentes. Adicione sua
          primeira conta ou jogo para começar.
        </p>
        <button
          type="button"
          onClick={onOpenCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-accent-hover cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Adicionar primeira instância
        </button>
      </main>
    );
  }

  const resolvedCols =
    viewMode === 'grid' ? resolveGridColumns(visibleInstances.length, gridColumns) : 1;

  return (
    <main
      ref={containerRef}
      className={`grid flex-1 gap-px bg-border-subtle overflow-hidden ${GRID_COLS_CLASS[resolvedCols]}`}
    >
      {visibleInstances.map((instance) => (
        <section key={instance.id} className="flex min-h-0 min-w-0 flex-col bg-surface-base">
          <SlotHeader
            instance={instance}
            runtime={runtimeMap[instance.id]}
            viewMode={viewMode}
            onGoBack={() => void window.idleDock.goBackInstance(instance.id)}
            onReload={() => void window.idleDock.reloadInstance(instance.id)}
            onToggleMute={() => onUpdateInstance(instance.id, { muted: !instance.muted })}
            onChangeZoom={(zoomFactor) => onUpdateInstance(instance.id, { zoomFactor })}
            onFocus={() => onFocusInstance(instance.id)}
            onEdit={() => onEditInstance(instance)}
            onOpenDevTools={() => void window.idleDock.openDevTools(instance.id)}
            onClearSession={() => {
              if (
                window.confirm(
                  `Limpar cookies e sessão de "${instance.name}"? Você precisará fazer login novamente nesta instância.`,
                )
              ) {
                void window.idleDock.clearSession(instance.id);
              }
            }}
            onRemove={() => {
              if (window.confirm(`Remover a instância "${instance.name}"?`)) {
                onRemoveInstance(instance.id);
              }
            }}
          />

          <div
            ref={(node) => {
              if (node) {
                slotRefs.current.set(instance.id, node);
              } else {
                slotRefs.current.delete(instance.id);
              }
            }}
            className="relative flex-1 bg-surface-base"
          />
        </section>
      ))}
    </main>
  );
}
