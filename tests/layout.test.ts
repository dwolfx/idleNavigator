import { describe, expect, it } from 'vitest';
import { clampZoomFactor, resolveGridColumns } from '../src/core/layout';

describe('Cálculo de colunas do grid e controle de zoom', () => {
  it('deve retornar 1 coluna quando houver 0 ou 1 instância', () => {
    expect(resolveGridColumns(0, 'auto')).toBe(1);
    expect(resolveGridColumns(1, 'auto')).toBe(1);
    expect(resolveGridColumns(1, 3)).toBe(1);
  });

  it('deve usar 2 colunas até 4 instâncias e 3 colunas a partir de 5 no modo automático', () => {
    expect(resolveGridColumns(2, 'auto')).toBe(2);
    expect(resolveGridColumns(4, 'auto')).toBe(2);
    expect(resolveGridColumns(5, 'auto')).toBe(3);
  });

  it('deve respeitar a preferência manual de 2 ou 3 colunas', () => {
    expect(resolveGridColumns(6, 2)).toBe(2);
    expect(resolveGridColumns(3, 3)).toBe(3);
    expect(resolveGridColumns(2, 3)).toBe(2);
  });

  it('deve limitar o fator de zoom entre 50% e 150%', () => {
    expect(clampZoomFactor(0.2)).toBe(0.5);
    expect(clampZoomFactor(1.1)).toBe(1.1);
    expect(clampZoomFactor(2.4)).toBe(1.5);
  });
});
