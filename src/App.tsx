import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Gamepad2,
  Grid2x2,
  LayoutGrid,
  Monitor,
  Plus,
} from 'lucide-react';
import { InstanceCard } from './components/InstanceCard';
import { InstanceModal } from './components/InstanceModal';
import type {
  AppState,
  BrowserId,
  DetectedBrowser,
  GameInstance,
  GridColumnsPreference,
} from './core/types';

const INITIAL_STATE: AppState = {
  instances: [],
  preferredBrowser: null,
  gridColumns: 'auto',
  minimizeToTray: true,
};

interface FeedbackMessage {
  kind: 'success' | 'error';
  text: string;
}

export function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [browsers, setBrowsers] = useState<DetectedBrowser[]>([]);
  const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingInstance, setEditingInstance] = useState<GameInstance | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const showFeedback = useCallback((kind: 'success' | 'error', text: string) => {
    setFeedback({ kind, text });
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!window.idleDock) return;
    void Promise.all([window.idleDock.getState(), window.idleDock.getBrowsers()]).then(
      ([loadedState, detected]) => {
        setState(loadedState);
        setBrowsers(detected);
      },
    );
  }, []);

  const handleLaunchAll = useCallback(async () => {
    const res = await window.idleDock.launchAllInGrid();
    if (!res.ok && res.error) {
      showFeedback('error', res.error);
    } else {
      showFeedback('success', 'Abrindo todas as instâncias organizadas em Grid.');
    }
  }, [showFeedback]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) return;
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setEditingInstance(null);
        setModalMode('create');
      } else if (event.key === 'Enter' && state.instances.length > 0) {
        event.preventDefault();
        void handleLaunchAll();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.instances.length, handleLaunchAll]);

  const handleCreateOrEdit = async (data: { name: string; url: string }) => {
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
    }));
  };

  const handleLaunch = async (instance: GameInstance) => {
    const res = await window.idleDock.launchInstance(instance.id);
    if (!res.ok && res.error) {
      showFeedback('error', res.error);
    }
  };

  const handleClearSession = async (instance: GameInstance) => {
    if (
      !window.confirm(
        `Limpar cookies e login de "${instance.name}"? Feche a janela deste jogo antes de continuar.`,
      )
    ) {
      return;
    }
    const res = await window.idleDock.clearSession(instance.id);
    if (res.ok) {
      showFeedback('success', `Sessão de "${instance.name}" limpa com sucesso.`);
    } else if (res.error) {
      showFeedback('error', res.error);
    }
  };

  const handleRemove = async (instance: GameInstance) => {
    if (!window.confirm(`Remover a instância "${instance.name}"?`)) return;
    const removed = await window.idleDock.removeInstance(instance.id);
    if (removed) {
      setState((prev) => ({
        ...prev,
        instances: prev.instances.filter((item) => item.id !== instance.id),
      }));
    }
  };

  const handleChangeBrowser = async (browser: BrowserId) => {
    setState((prev) => ({ ...prev, preferredBrowser: browser }));
    await window.idleDock.setPreferredBrowser(browser);
  };

  const handleChangeGridColumns = async (gridColumns: GridColumnsPreference) => {
    setState((prev) => ({ ...prev, gridColumns }));
    await window.idleDock.setGridColumns(gridColumns);
  };

  const handleToggleMinimizeToTray = async (minimizeToTray: boolean) => {
    setState((prev) => ({ ...prev, minimizeToTray }));
    await window.idleDock.setMinimizeToTray(minimizeToTray);
  };

  const activeBrowserId = state.preferredBrowser ?? browsers[0]?.id ?? '';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-base text-content-primary">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface-elevated px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-content-primary">
              IdleNavigator
            </h1>
            <p className="text-xs text-content-muted">
              Perfis isolados no navegador oficial com anti-throttling 24/7
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {state.instances.length > 0 && (
            <button
              type="button"
              onClick={() => void handleLaunchAll()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface-overlay px-3.5 py-2 text-xs font-medium text-content-primary transition hover:bg-surface-hover cursor-pointer"
            >
              <Grid2x2 className="h-4 w-4 text-accent-hover" strokeWidth={1.75} />
              Abrir todas em Grid
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingInstance(null);
              setModalMode('create');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white transition hover:bg-accent-hover cursor-pointer"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nova instância
          </button>
        </div>
      </header>

      {/* Barra de controles */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border-subtle bg-surface-base px-6 py-2.5 text-xs text-content-secondary">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-content-muted">Navegador:</span>
            {browsers.length > 0 ? (
              <select
                value={activeBrowserId}
                onChange={(e) => void handleChangeBrowser(e.target.value as BrowserId)}
                className="rounded-md border border-border-strong bg-surface-elevated px-2.5 py-1 text-xs text-content-primary focus:border-accent focus:outline-none cursor-pointer"
              >
                {browsers.map((browser) => (
                  <option key={browser.id} value={browser.id}>
                    {browser.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-status-error">Nenhum navegador Chromium detectado</span>
            )}
          </label>

          <div className="flex items-center gap-1.5">
            <span className="text-content-muted">Grid:</span>
            {(['auto', 2, 3] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => void handleChangeGridColumns(option)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                  state.gridColumns === option
                    ? 'bg-accent text-white'
                    : 'bg-surface-elevated text-content-secondary hover:text-content-primary'
                }`}
              >
                {option === 'auto' ? 'Auto' : `${option} col`}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <Monitor className="h-3.5 w-3.5 text-content-muted" strokeWidth={1.75} />
          <span>Minimizar p/ bandeja</span>
          <input
            type="checkbox"
            checked={state.minimizeToTray}
            onChange={(e) => void handleToggleMinimizeToTray(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border-strong accent-accent cursor-pointer"
          />
        </label>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex shrink-0 items-center gap-2 border-b border-border-subtle px-6 py-2 text-xs ${
            feedback.kind === 'error'
              ? 'bg-status-error/10 text-status-error'
              : 'bg-status-ready/10 text-status-ready'
          }`}
        >
          {feedback.kind === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto p-6">
        {state.instances.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated ring-1 ring-border-subtle">
              <Gamepad2 className="h-7 w-7 text-accent-hover" strokeWidth={1.75} />
            </div>
            <h2 className="text-base font-semibold text-content-primary">
              Nenhuma instância cadastrada ainda
            </h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-content-secondary">
              Cada instância abre em modo app limpo no seu navegador oficial com perfil isolado —
              Login com Google e Cloudflare funcionam normalmente, sem as abas dormirem.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingInstance(null);
                setModalMode('create');
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-accent-hover cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Adicionar primeira instância
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.instances.map((instance, index) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                index={index}
                onLaunch={() => void handleLaunch(instance)}
                onEdit={() => {
                  setEditingInstance(instance);
                  setModalMode('edit');
                }}
                onClearSession={() => void handleClearSession(instance)}
                onRemove={() => void handleRemove(instance)}
              />
            ))}
          </div>
        )}
      </main>

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
