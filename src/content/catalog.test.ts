import { describe, expect, it } from 'vitest';
import { createCatalog } from './catalog';
import { contentData } from './data';
import type { ContentData, Photo } from './types';

const clone = (): ContentData => structuredClone(contentData);
const catalog = createCatalog(contentData);

describe('real content', () => {
  it('passes validation', () => {
    expect(catalog.validate()).toEqual([]);
  });

  it('has five rolls and six series', () => {
    expect(catalog.listRolls().map((r) => r.id)).toEqual(['lover', 'grads', 'event', 'product', 'studio']);
    expect(catalog.listSeries()).toHaveLength(6);
  });
});

describe('queries', () => {
  it('filters gallery photos by roll', () => {
    const grads = catalog.listPhotos({ roll: 'grads' });
    expect(grads.length).toBeGreaterThan(0);
    expect(grads.every((p) => p.roll === 'grads' && p.inGallery)).toBe(true);
    expect(catalog.listPhotos().length).toBeGreaterThan(grads.length);
  });

  it('recognises roll ids only', () => {
    expect(catalog.isRoll('lover')).toBe(true);
    expect(catalog.isRoll('wedding')).toBe(false);
    expect(catalog.isRoll(null)).toBe(false);
  });

  it('returns series photos in curated order', () => {
    const ids = catalog.seriesPhotos('dara-grad').map((p) => p.id);
    expect(ids[0]).toBe('dara-grad-01');
    expect(ids).toEqual([...ids].sort());
  });

  it('groups chapter photos in chapter order', () => {
    const chapters = catalog.seriesChapters('love-story');
    expect(chapters.map((c) => c.chapter)).toEqual(['Engagement', 'Pre-wedding', 'Wedding', 'Studio']);
    expect(chapters.every((c) => c.photos.length > 0)).toBe(true);
  });

  it('wraps nextSeries around to the first series', () => {
    const all = catalog.listSeries();
    expect(catalog.nextSeries(all[0].slug)?.slug).toBe(all[1].slug);
    expect(catalog.nextSeries(all[all.length - 1].slug)?.slug).toBe(all[0].slug);
    expect(catalog.nextSeries('nope')).toBeUndefined();
  });

  it('builds the showreel only from flagged photos', () => {
    expect(catalog.showreel().every((p) => p.showreel)).toBe(true);
  });
});

describe('privacy', () => {
  it('never returns excluded photos from any query', () => {
    const data = clone();
    const target = data.photos.find((p) => p.id === 'dara-grad-02')!;
    Object.assign(target, { consent: 'exclude', inGallery: true, showreel: true } satisfies Partial<Photo>);
    const c = createCatalog(data);
    const everything = [
      ...c.listPhotos(),
      ...c.showreel(),
      ...c.seriesPhotos('dara-grad'),
      ...c.seriesChapters('love-story').flatMap((ch) => ch.photos),
    ];
    expect(everything.some((p) => p.id === 'dara-grad-02')).toBe(false);
    expect(c.getPhoto('dara-grad-02')).toBeUndefined();
  });

  it('keeps anonymised series behind their alias', () => {
    const s = catalog.getSeries('love-story')!;
    expect(s.clientLabel).toBe('A & D');
    expect(JSON.stringify(s)).not.toMatch(/avyra|dandi/i);
    expect(catalog.seriesPhotos('love-story').every((p) => p.consent === 'anonymize')).toBe(true);
  });
});

describe('validation errors', () => {
  const problems = (mutate: (d: ContentData) => void) => {
    const d = clone();
    mutate(d);
    return createCatalog(d).validate().join('\n');
  };

  it('rejects duplicate ids', () => {
    expect(problems((d) => d.photos.push({ ...d.photos[0] }))).toMatch(/Duplicate photo id "aquatics-01"/);
  });

  it('rejects empty alt text', () => {
    expect(problems((d) => (d.photos[0].alt = '  '))).toMatch(/"aquatics-01" has empty alt/);
  });

  it('rejects a missing cover', () => {
    expect(problems((d) => (d.series[0].cover = 'ghost'))).toMatch(/cover "ghost" does not exist/);
  });

  it('rejects unknown series slugs', () => {
    expect(problems((d) => (d.photos[0].series = 'nope'))).toMatch(/unknown series "nope"/);
  });

  it('rejects series outside the curation limits', () => {
    expect(problems((d) => (d.photos = d.photos.filter((p) => !p.id.startsWith('silat-') || p.id === 'silat-01'))))
      .toMatch(/Series "silat-bumi-padjadjaran" has 1 photos/);
  });

  it('rejects rolls outside the gallery limits', () => {
    expect(problems((d) => d.photos.forEach((p) => p.roll === 'studio' && (p.inGallery = false)))).toMatch(
      /Roll "studio" has 0 gallery photos/,
    );
  });

  it('rejects an oversized showreel', () => {
    expect(problems((d) => d.photos.forEach((p) => (p.showreel = true)))).toMatch(/Showreel has \d+ photos/);
  });
});
