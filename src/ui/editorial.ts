export type RowKind = 'full' | 'pair' | 'offset';

const RHYTHM: RowKind[] = ['full', 'pair', 'offset', 'pair'];

/**
 * Splits photos into the editorial rhythm: one full-bleed frame, a pair, a single
 * offset frame, another pair, repeat. A pair that would be left with one photo
 * becomes an offset single so no row looks half-empty.
 */
export function editorialRows<T>(items: T[]): { kind: RowKind; items: T[] }[] {
  const rows: { kind: RowKind; items: T[] }[] = [];
  let i = 0;
  for (let step = 0; i < items.length; step++) {
    let kind = RHYTHM[step % RHYTHM.length];
    if (kind === 'pair' && i + 1 >= items.length) kind = 'offset';
    const size = kind === 'pair' ? 2 : 1;
    rows.push({ kind, items: items.slice(i, i + size) });
    i += size;
  }
  return rows;
}
