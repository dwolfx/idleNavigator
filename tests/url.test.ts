import { describe, expect, it } from 'vitest';
import { extractHostname, normalizeGameUrl } from '../src/core/url';

describe('Normalização e validação de URLs de jogos', () => {
  it('deve adicionar https:// automaticamente quando o protocolo for omitido', () => {
    expect(normalizeGameUrl('melvoridle.com')).toBe('https://melvoridle.com/');
  });

  it('deve preservar URLs válidas com http ou https e caminhos', () => {
    expect(normalizeGameUrl('https://jogo.exemplo.com/play?server=2')).toBe(
      'https://jogo.exemplo.com/play?server=2',
    );
    expect(normalizeGameUrl('http://localhost:3000/idle')).toBe('http://localhost:3000/idle');
  });

  it('deve rejeitar entradas vazias, protocolos inseguros ou domínios inválidos', () => {
    expect(normalizeGameUrl('')).toBeNull();
    expect(normalizeGameUrl('   ')).toBeNull();
    expect(normalizeGameUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeGameUrl('file:///C:/Windows')).toBeNull();
    expect(normalizeGameUrl('apenas-uma-palavra')).toBeNull();
  });

  it('deve extrair o hostname limpo sem o prefixo www', () => {
    expect(extractHostname('https://www.melvoridle.com/game')).toBe('melvoridle.com');
    expect(extractHostname('https://play.exemplo.org')).toBe('play.exemplo.org');
  });
});
