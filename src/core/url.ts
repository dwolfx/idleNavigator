/**
 * Normaliza uma URL digitada pelo usuário, adicionando https:// quando ausente.
 * Retorna null se a URL for inválida ou usar protocolo não permitido.
 */
export function normalizeGameUrl(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Extrai o domínio legível de uma URL para exibição secundária.
 */
export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
