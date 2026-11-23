/// <reference types="node" />
// Runs in Node (Vitest): checks the pipeline's output files on disk.
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalog } from '.';
import meta from './photo-meta.json';

// Vitest runs from the project root.
const PUBLIC = join(process.cwd(), 'public');
const entries = Object.entries(meta as Record<string, { width: number; height: number; widths: number[]; blur: string }>);
const file = (id: string, w: number, f: string) => join(PUBLIC, 'photos', `${id}-${w}.${f}`);

describe('processed photos (npm run photos)', () => {
  it('every rendition listed in the metadata exists', () => {
    const missing = entries.flatMap(([id, m]) =>
      m.widths.flatMap((w) => ['avif', 'webp'].map((f) => file(id, w, f))).filter((p) => !existsSync(p)),
    );
    expect(missing).toEqual([]);
  });

  it('has sane dimensions, ascending widths and a tiny blur preview', () => {
    for (const [, m] of entries) {
      expect(m.width).toBeGreaterThan(0);
      expect(m.height).toBeGreaterThan(0);
      expect([...m.widths].sort((a, b) => a - b)).toEqual(m.widths);
      expect(Math.max(...m.widths)).toBeLessThanOrEqual(m.width);
      expect(m.blur).toMatch(/^data:image\/webp;base64,/);
      expect(m.blur.length).toBeLessThan(2000);
    }
  });

  it('keeps the largest rendition under ~400 KB on average', () => {
    for (const format of ['avif', 'webp']) {
      const sizes = entries.map(([id, m]) => statSync(file(id, Math.max(...m.widths), format)).size);
      const average = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      expect(average / 1024, format).toBeLessThan(400);
    }
  });

  it('every real photo used by the site has been processed', () => {
    const all = [
      ...catalog.listPhotos(),
      ...catalog.listSeries().flatMap((s) => catalog.seriesPhotos(s.slug)),
      ...catalog.showreel(),
    ];
    const unprocessed = all.filter((p) => p.tone === undefined && !p.image).map((p) => p.id);
    expect(unprocessed).toEqual([]);
  });
});
