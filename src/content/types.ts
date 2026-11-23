/** The five "rolls" (categories) of the datworks archive, named after the original Drive folders. */
export type RollId = 'lover' | 'grads' | 'event' | 'product' | 'studio';

/** Whether a photo may be shown publicly. `exclude` photos are never returned by any query. */
export type Consent = 'ok' | 'anonymize' | 'exclude';

export type SeriesLayout = 'horizontal' | 'chapters' | 'blur' | 'editorial' | 'catalog';

export interface Roll {
  id: RollId;
  title: string;
  /** One-line description shown on the Work page. */
  blurb: string;
}

export interface Photo {
  /** Unique id, e.g. `aquatics-07`. Also the base name of the processed image files. */
  id: string;
  roll: RollId;
  /** Slug of the series this photo belongs to, if any. */
  series?: string;
  /** Chapter (or catalog group) name, for series that define `chapters`. */
  chapter?: string;
  /** Meaningful alternative text (English). Required. */
  alt: string;
  width: number;
  height: number;
  /** Shown in the roll grid on the Work page. */
  inGallery?: boolean;
  /** Part of the Home showreel. */
  showreel?: boolean;
  consent: Consent;
  /** Placeholder tone (0–360 hue) used until real photos are processed. */
  tone?: number;
}

export interface Series {
  slug: string;
  title: string;
  year: string;
  roll: RollId;
  layout: SeriesLayout;
  /** Client name as displayed: the real name, or an alias such as `A & D` until consent is confirmed. */
  clientLabel: string;
  intro: string;
  /** Photo id used as the cover. */
  cover: string;
  /** Chapter order for the `chapters` layout, or product groups for `catalog`. */
  chapters?: string[];
  /** One short opening line per chapter, keyed by chapter name. */
  chapterNotes?: Record<string, string>;
}

export interface ContentData {
  rolls: Roll[];
  series: Series[];
  photos: Photo[];
}

/** Curation limits from the spec, enforced by `validate()`. */
export const LIMITS = {
  showreel: { min: 10, max: 12 },
  galleryPerRoll: { min: 12, max: 16 },
  perSeries: { min: 10, max: 20 },
  totalPhotos: { max: 150 },
} as const;
