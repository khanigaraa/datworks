import { describe, expect, it } from 'vitest';
import { editorialRows } from './editorial';

describe('editorialRows', () => {
  it('follows the full / pair / offset / pair rhythm', () => {
    const rows = editorialRows([1, 2, 3, 4, 5, 6, 7]);
    expect(rows.map((r) => r.kind)).toEqual(['full', 'pair', 'offset', 'pair', 'full']);
    expect(rows.flatMap((r) => r.items)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('never leaves a pair half-empty', () => {
    const rows = editorialRows([1, 2]);
    expect(rows).toEqual([
      { kind: 'full', items: [1] },
      { kind: 'offset', items: [2] },
    ]);
  });

  it('handles an empty series', () => {
    expect(editorialRows([])).toEqual([]);
  });
});
