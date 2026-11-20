export type GridColumnsPreference = 'auto' | 2 | 3;

export interface WorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
 * Calcula posição e tamanho de cada janela para preencher a área útil do monitor em Grid.
 */
export function calculateWindowGridRects(
  count: number,
  workArea: WorkArea,
  preference: GridColumnsPreference = 'auto',
): WindowRect[] {
  if (count <= 0) return [];

  const cols = resolveGridColumns(count, preference);
  const rows = Math.ceil(count / cols);
  const cellWidth = Math.floor(workArea.width / cols);
  const cellHeight = Math.floor(workArea.height / rows);

  const rects: WindowRect[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    rects.push({
      x: workArea.x + col * cellWidth,
      y: workArea.y + row * cellHeight,
      width: cellWidth,
      height: cellHeight,
    });
  }

  return rects;
}
