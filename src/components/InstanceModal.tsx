import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { GameInstance } from '../core/types';
import { normalizeGameUrl } from '../core/url';

interface InstanceModalProps {
  initial?: GameInstance | null;
  onClose: () => void;
  onSubmit: (data: { name: string; url: string }) => Promise<void>;
}

export function InstanceModal({ initial, onClose, onSubmit }: InstanceModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe um nome para identificar esta instância.');
      return;
    }

    const normalized = normalizeGameUrl(url);
    if (!normalized) {
      setError('Informe uma URL válida (ex: melvoridle.com ou https://...).');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: trimmedName, url: normalized });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
          <h2 className="text-sm font-semibold text-content-primary">
            {initial ? 'Editar instância' : 'Nova instância'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label htmlFor="instance-name" className="block text-xs font-medium text-content-secondary">
              Nome do jogo ou conta
            </label>
            <input
              id="instance-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Conta Principal — Melvor"
              className="w-full rounded-lg border border-border-strong bg-surface-base px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="instance-url" className="block text-xs font-medium text-content-secondary">
              URL do jogo
            </label>
            <input
              id="instance-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border-strong bg-surface-base px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-status-error/15 px-3 py-2 text-xs text-status-error">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-xs font-medium text-content-secondary transition hover:bg-surface-hover hover:text-content-primary cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
            >
              {initial ? 'Salvar alterações' : 'Criar instância'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
