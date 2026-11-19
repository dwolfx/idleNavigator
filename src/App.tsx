import { useCallback, useEffect, useState } from 'react';
import { InstanceModal } from './components/InstanceModal';
import { Sidebar } from './components/Sidebar';
import { ViewportArea } from './components/ViewportArea';
import type { AppState, GameInstance, InstanceRuntimeState, ViewMode } from './core/types';

const INITIAL_STATE: AppState = {
  instances: [],
  activeInstanceId: null,
  viewMode: 'focus',
  gridColumns: 'auto',
  minimizeToTray: true,
};

export function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [runtimeMap, setRuntimeMap] = useState<Record<string, InstanceRuntimeState>>({});
  const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingInstance, setEditingInstance] = useState<GameInstance | null>(null);

  useEffect(() => {
    if (!window.idleDock) return;

    void window.idleDock.getState().then(setState);

    return window.idleDock.onRuntimeUpdate(({ id, state: runtimeState }) => {
      setRuntimeMap((prev) => ({ ...prev, [id]: runtimeState }));
    });
  }, []);

  // Esconde as WebContentsView enquanto o modal estiver aberto para não sobrepor a UI
  useEffect(() => {
    window.idleDock?.setViewsOverlayHidden(modalMode !== 'closed');
  }, [modalMode]);

  const handleSelectInstance = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, activeInstanceId: id, viewMode: 'focus' }));
    await window.idleDock?.setActiveInstance(id);
    await window.idleDock?.setViewMode('focus');
  }, []);

  const handleChangeViewMode = useCallback(async (mode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
    await window.idleDock?.setViewMode(mode);
  }, []);

  // Atalhos: Ctrl+1..9 alterna instância, Ctrl+N cria nova, Ctrl+G alterna Grid/Foco
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) return;

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setEditingInstance(null);
        setModalMode('create');
        return;
      }

      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        void handleChangeViewMode(state.viewMode === 'focus' ? 'grid' : 'focus');
        return;
      }

      const num = Number(event.key);
      if (num >= 1 && num <= 9) {
        const target = state.instances[num - 1];
        if (target) {
          event.preventDefault();
          void handleSelectInstance(target.id);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.instances, state.viewMode, handleChangeViewMode, handleSelectInstance]);

  const handleCreateOrEdit = async (data: { name: string; url: string; autoReload: boolean }) => {
    if (modalMode === 'edit' && editingInstance) {
      const updated = await window.idleDock.updateInstance({
        id: editingInstance.id,
        ...data,
      });
      if (updated) {
        setState((prev) => ({
          ...prev,
          instances: prev.instances.map((item) => (item.id === updated.id ? updated : item)),
        }));
      }
      return;
    }

    const created = await window.idleDock.createInstance(data);
    setState((prev) => ({
      ...prev,
      instances: [...prev.instances, created],
      activeInstanceId: created.id,
    }));
  };

  const handleUpdateInstance = async (
    id: string,
    patch: Partial<Pick<GameInstance, 'muted' | 'zoomFactor'>>,
  ) => {
    const updated = await window.idleDock.updateInstance({ id, ...patch });
    if (!updated) return;
    setState((prev) => ({
      ...prev,
      instances: prev.instances.map((item) => (item.id === updated.id ? updated : item)),
    }));
  };

  const handleRemoveInstance = async (id: string) => {
    const removed = await window.idleDock.removeInstance(id);
    if (!removed) return;
    setState((prev) => {
      const remaining = prev.instances.filter((item) => item.id !== id);
      const nextActive =
        prev.activeInstanceId === id ? (remaining[0]?.id ?? null) : prev.activeInstanceId;
      return { ...prev, instances: remaining, activeInstanceId: nextActive };
    });
  };

  const handleChangeGridColumns = async (gridColumns: 'auto' | 2 | 3) => {
    setState((prev) => ({ ...prev, gridColumns }));
    await window.idleDock?.setGridColumns(gridColumns);
  };

  const handleToggleMinimizeToTray = async (minimizeToTray: boolean) => {
    setState((prev) => ({ ...prev, minimizeToTray }));
    await window.idleDock?.setMinimizeToTray(minimizeToTray);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-base text-content-primary">
      <Sidebar
        instances={state.instances}
        activeInstanceId={state.activeInstanceId}
        runtimeMap={runtimeMap}
        viewMode={state.viewMode}
        gridColumns={state.gridColumns}
        minimizeToTray={state.minimizeToTray}
        onSelectInstance={(id) => void handleSelectInstance(id)}
        onOpenCreate={() => {
          setEditingInstance(null);
          setModalMode('create');
        }}
        onOpenEdit={(instance) => {
          setEditingInstance(instance);
          setModalMode('edit');
        }}
        onToggleMute={(instance) => void handleUpdateInstance(instance.id, { muted: !instance.muted })}
        onChangeViewMode={(mode) => void handleChangeViewMode(mode)}
        onChangeGridColumns={(cols) => void handleChangeGridColumns(cols)}
        onToggleMinimizeToTray={(enabled) => void handleToggleMinimizeToTray(enabled)}
      />

      <ViewportArea
        instances={state.instances}
        activeInstanceId={state.activeInstanceId}
        runtimeMap={runtimeMap}
        viewMode={state.viewMode}
        gridColumns={state.gridColumns}
        onOpenCreate={() => {
          setEditingInstance(null);
          setModalMode('create');
        }}
        onFocusInstance={(id) => void handleSelectInstance(id)}
        onEditInstance={(instance) => {
          setEditingInstance(instance);
          setModalMode('edit');
        }}
        onUpdateInstance={(id, patch) => void handleUpdateInstance(id, patch)}
        onRemoveInstance={(id) => void handleRemoveInstance(id)}
      />

      {modalMode !== 'closed' && (
        <InstanceModal
          initial={modalMode === 'edit' ? editingInstance : null}
          onClose={() => setModalMode('closed')}
          onSubmit={handleCreateOrEdit}
        />
      )}
    </div>
  );
}
