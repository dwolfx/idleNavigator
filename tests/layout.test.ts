import { describe, expect, it } from 'vitest';
import { calculateWindowGridRects, resolveGridColumns } from '../src/core/layout';

describe('Cálculo de colunas e posicionamento de janelas em Grid', () => {
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

  it('deve dividir a área útil do monitor em 4 quadrantes iguais para 4 instâncias', () => {
    const rects = calculateWindowGridRects(
      4,
      { x: 0, y: 0, width: 1920, height: 1040 },
      'auto',
    );

    expect(rects).toHaveLength(4);
    expect(rects[0]).toEqual({ x: 0, y: 0, width: 960, height: 520 });
    expect(rects[1]).toEqual({ x: 960, y: 0, width: 960, height: 520 });
    expect(rects[2]).toEqual({ x: 0, y: 520, width: 960, height: 520 });
    expect(rects[3]).toEqual({ x: 960, y: 520, width: 960, height: 520 });
  });
});
