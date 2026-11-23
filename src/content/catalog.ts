import { LIMITS, type ContentData, type Photo, type Roll, type RollId, type Series } from './types';

export interface Catalog {
  listRolls(): Roll[];
  isRoll(value: string | null | undefined): value is RollId;
  /** Gallery photos, optionally filtered by roll, in curated order. */
  listPhotos(filter?: { roll?: RollId }): Photo[];
  listSeries(): Series[];
  getSeries(slug: string): Series | undefined;
  /** Photos of a series in curated order. */
  seriesPhotos(slug: string): Photo[];
  /** Photos of a series with `chapters` (story chapters or catalog groups), in chapter order. */
  seriesChapters(slug: string): { chapter: string; photos: Photo[] }[];
  /** The series after `slug`, wrapping around to the first one. */
  nextSeries(slug: string): Series | undefined;
  showreel(): Photo[];
  getPhoto(id: string): Photo | undefined;
  /** Returns a list of human-readable problems; empty means the content is valid. */
  validate(): string[];
}

/**
 * The content module: all rolls, series and photos plus pure queries over them.
 * Photos with `consent: 'exclude'` are filtered out once here, so no query can leak them.
 */
export function createCatalog(data: ContentData): Catalog {
  const visible = data.photos.filter((p) => p.consent !== 'exclude');
  const rollIds = new Set<string>(data.rolls.map((r) => r.id));

  const catalog: Catalog = {
    listRolls: () => [...data.rolls],
    isRoll: (value): value is RollId => !!value && rollIds.has(value),
    listPhotos: (filter = {}) =>
      visible.filter((p) => p.inGallery && (!filter.roll || p.roll === filter.roll)),
    listSeries: () => [...data.series],
    getSeries: (slug) => data.series.find((s) => s.slug === slug),
    seriesPhotos: (slug) => visible.filter((p) => p.series === slug),
    seriesChapters: (slug) => {
      const series = catalog.getSeries(slug);
      if (!series?.chapters) return [];
      const photos = catalog.seriesPhotos(slug);
      return series.chapters.map((chapter) => ({
        chapter,
        photos: photos.filter((p) => p.chapter === chapter),
      }));
    },
    nextSeries: (slug) => {
      const i = data.series.findIndex((s) => s.slug === slug);
      if (i === -1) return undefined;
      return data.series[(i + 1) % data.series.length];
    },
    showreel: () => visible.filter((p) => p.showreel),
    getPhoto: (id) => visible.find((p) => p.id === id),
    validate: () => validate(data, visible, catalog),
  };
  return catalog;
}

function validate(data: ContentData, visible: Photo[], catalog: Catalog): string[] {
  const errors: string[] = [];
  const seriesSlugs = new Set(data.series.map((s) => s.slug));

  const seen = new Set<string>();
  for (const p of data.photos) {
    if (seen.has(p.id)) errors.push(`Duplicate photo id "${p.id}"`);
    seen.add(p.id);
    if (!p.alt.trim()) errors.push(`Photo "${p.id}" has empty alt text`);
    if (!catalog.isRoll(p.roll)) errors.push(`Photo "${p.id}" has unknown roll "${p.roll}"`);
    if (p.series && !seriesSlugs.has(p.series))
      errors.push(`Photo "${p.id}" refers to unknown series "${p.series}"`);
    if (!(p.width > 0 && p.height > 0)) errors.push(`Photo "${p.id}" has invalid dimensions`);
  }

  const seenSlugs = new Set<string>();
  for (const s of data.series) {
    if (seenSlugs.has(s.slug)) errors.push(`Duplicate series slug "${s.slug}"`);
    seenSlugs.add(s.slug);
    const cover = visible.find((p) => p.id === s.cover);
    if (!cover) errors.push(`Series "${s.slug}" cover "${s.cover}" does not exist`);
    const count = catalog.seriesPhotos(s.slug).length;
    if (count < LIMITS.perSeries.min || count > LIMITS.perSeries.max)
      errors.push(
        `Series "${s.slug}" has ${count} photos (allowed ${LIMITS.perSeries.min}–${LIMITS.perSeries.max})`,
      );
    if (s.layout === 'chapters' && !s.chapters?.length)
      errors.push(`Series "${s.slug}" uses chapters but defines none`);
    if (s.chapters?.length) {
      for (const p of catalog.seriesPhotos(s.slug))
        if (!p.chapter || !s.chapters?.includes(p.chapter))
          errors.push(`Photo "${p.id}" has no valid chapter for series "${s.slug}"`);
    }
  }

  for (const r of data.rolls) {
    const count = catalog.listPhotos({ roll: r.id }).length;
    if (count < LIMITS.galleryPerRoll.min || count > LIMITS.galleryPerRoll.max)
      errors.push(
        `Roll "${r.id}" has ${count} gallery photos (allowed ${LIMITS.galleryPerRoll.min}–${LIMITS.galleryPerRoll.max})`,
      );
  }

  const reel = catalog.showreel().length;
  if (reel < LIMITS.showreel.min || reel > LIMITS.showreel.max)
    errors.push(`Showreel has ${reel} photos (allowed ${LIMITS.showreel.min}–${LIMITS.showreel.max})`);

  if (visible.length > LIMITS.totalPhotos.max)
    errors.push(`${visible.length} photos in total (max ${LIMITS.totalPhotos.max})`);

  return errors;
}
