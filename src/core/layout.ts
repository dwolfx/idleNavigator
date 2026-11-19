export type GridColumnsPreference = 'auto' | 2 | 3;

/**
 * Resolve o número ideal de colunas do grid com base na quantidade de instâncias
 * e na preferência do usuário.
 */
export function resolveGridColumns(
  instanceCount: number,
  preference: GridColumnsPreference,
): 1 | 2 | 3 {
  if (instanceCount <= 1) return 1;
  if (preference === 2) return 2;
  if (preference === 3) return instanceCount === 2 ? 2 : 3;

  // Modo automático: 2 colunas até 4 jogos, 3 colunas a partir de 5
  return instanceCount <= 4 ? 2 : 3;
}

/**
 * Mantém o fator de zoom dentro dos limites seguros (50% a 150%).
 */
export function clampZoomFactor(factor: number): number {
  const rounded = Math.round(factor * 100) / 100;
  return Math.min(1.5, Math.max(0.5, rounded));
}
