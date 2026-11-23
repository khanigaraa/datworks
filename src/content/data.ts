import photoMeta from './photo-meta.json';
import type { ContentData, Photo, PhotoImage, Roll, RollId, Series } from './types';

/**
 * Content for the DARKROOM site.
 *
 * Real photos come from the image pipeline (`npm run photos` → photo-meta.json). Series that
 * don't have their real photos yet (ticket 11) use dark placeholders generated below; their
 * ids already follow the final naming scheme.
 * Client-facing series stay anonymised (`clientLabel` alias) until datworks confirms consent.
 */

type Meta = PhotoImage & { width: number; height: number };
const META = photoMeta as Record<string, Meta>;

/**
 * A processed photo. If the pipeline hasn't produced it yet, width/height are 0 and
 * `validate()` (run at build time) reports it, so a missing photo can't ship silently.
 */
function real(id: string, roll: RollId, alt: string, extra: Partial<Photo> = {}): Photo {
  const m = META[id];
  return {
    id,
    roll,
    alt,
    width: m?.width ?? 0,
    height: m?.height ?? 0,
    consent: 'ok',
    image: m && { widths: m.widths, blur: m.blur },
    ...extra,
  };
}

export const rolls: Roll[] = [
  { id: 'lover', title: 'Lover', blurb: 'Engagements, pre-weddings and weddings.' },
  { id: 'grads', title: 'Grads', blurb: 'Graduation portraits and the people behind them.' },
  { id: 'event', title: 'Event', blurb: 'Sport, stage, culture and corporate gatherings.' },
  { id: 'product', title: 'Product', blurb: 'Food, objects and craft, lit like still life.' },
  { id: 'studio', title: 'Studio', blurb: 'Backdrop portraits made in the studio.' },
];

export const series: Series[] = [
  {
    slug: 'west-java-aquatics',
    title: 'West Java Aquatics',
    year: '2023–2026',
    roll: 'event',
    layout: 'horizontal',
    clientLabel: 'Akuatik Jawa Barat',
    intro: 'Four seasons poolside: swimming, diving and water polo across West Java championships.',
    cover: 'aquatics-01',
  },
  {
    slug: 'love-story',
    title: 'A Love Story in 4 Chapters',
    year: '2025',
    roll: 'lover',
    layout: 'chapters',
    clientLabel: 'A & D',
    intro: 'One couple, four sessions: from the engagement to the studio, told in order.',
    cover: 'love-story-01',
    chapters: ['Engagement', 'Pre-wedding', 'Wedding', 'Studio'],
    chapterNotes: {
      Engagement: 'Two families in one room, and a ring that made it official.',
      'Pre-wedding': 'Golden hour, borrowed time: the two of them before the big day.',
      Wedding: 'The vows, the noise, the long table, the first dance.',
      Studio: 'After it all, against a plain blue backdrop: just A & D.',
    },
  },
  {
    slug: 'dara-grad',
    title: 'Dara Grad',
    year: '2025',
    roll: 'grads',
    layout: 'editorial',
    clientLabel: 'D.',
    intro: 'A graduation day, slowed down: the gown, the family, the quiet moments in between.',
    cover: 'dara-grad-04',
  },
  {
    slug: 'silat-bumi-padjadjaran',
    title: 'Silat Bumi Padjadjaran',
    year: '2025',
    roll: 'event',
    layout: 'blur',
    clientLabel: 'Silat Bumi Padjadjaran',
    intro: 'Pencak silat in motion: speed, breath and tradition.',
    cover: 'silat-01',
  },
  {
    slug: 'ace-gathering-2025',
    title: 'ACE Gathering & Seminar',
    year: '2025',
    roll: 'event',
    layout: 'editorial',
    clientLabel: 'ACE',
    intro: 'A corporate gathering documented like a feature, not a headcount.',
    cover: 'ace-01',
  },
  {
    slug: 'still-life',
    title: 'Still Life',
    year: '2025',
    roll: 'product',
    layout: 'catalog',
    clientLabel: 'Dua Dimsum · My Cookies · ITB Gitar Nusantara',
    intro: 'Dimsum, cookies and handmade guitars, catalogued frame by frame.',
    cover: 'still-life-01',
    chapters: ['Dua Dimsum', 'My Cookies', 'ITB Gitar Nusantara'],
  },
];

const TONE: Record<RollId, number> = { lover: 350, grads: 38, event: 200, product: 22, studio: 225 };

function placeholder(id: string, roll: RollId, alt: string, i: number, extra: Partial<Photo> = {}): Photo {
  const portrait = i % 3 !== 1;
  return {
    id,
    roll,
    alt,
    width: portrait ? 1600 : 2400,
    height: portrait ? 2000 : 1600,
    consent: 'ok',
    tone: TONE[roll] + ((i * 7) % 20) - 10,
    ...extra,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

const SERIES_PREFIX: Record<string, string> = {
  'west-java-aquatics': 'aquatics',
  'love-story': 'love-story',
  'dara-grad': 'dara-grad',
  'silat-bumi-padjadjaran': 'silat',
  'ace-gathering-2025': 'ace',
  'still-life': 'still-life',
};

/**
 * Dara Grad, in story order: the details, the portraits on the red stairs, a black-and-white
 * pause, then friends and family. Ids are the original file names ("dara grad-04.jpg").
 * `g` = also in the Grads gallery on /work, `r` = in the Home showreel.
 */
const DARA: [n: number, alt: string, flags?: 'g' | 'r' | 'gr'][] = [
  [4, 'A graduate in a black gown and medal leans on a red railing above a green campus lawn, smiling up at the camera', 'gr'],
  [1, 'Hands holding a bouquet of orange and white flowers tied with a white ribbon, a graduation sash in the corner', 'g'],
  [2, 'A hand grips a red university diploma tube against a soft, sunlit background'],
  [3, 'The graduate stands at the top of a red staircase in her gown and medal, trees and paths behind her', 'g'],
  [5, 'Beside a red steel staircase, the graduate raises her cap in the air'],
  [7, 'Framed by red stair railings, the graduate looks up at the camera with campus trees behind', 'g'],
  [6, 'Seen through a gap in red railings, the graduate stands in the middle of the lawn'],
  [9, 'Black and white: the graduate in a kebaya stands alone against a plain wall, holding her diploma folder', 'g'],
  [10, 'Black and white: the graduate in sunglasses leans against a wall beside a staircase'],
  [13, 'The graduate and a friend sit on the grass with a bouquet, laughing', 'g'],
  [14, 'Two faces peek out from behind a red pillar, one of them holding a graduation cap', 'g'],
  [16, 'The graduate walks past a red-and-white campus building while her cap flies through the air'],
  [18, 'Her parents laugh together, her mother holding a bunch of purple flowers', 'g'],
  [20, 'The graduate walks toward her parents along a tree-lined path, reaching for their hands'],
  [21, 'Her father laughs through an orange life buoy hanging by the pool', 'gr'],
  [22, 'Low angle: her parents stand side by side against a pale sky, holding purple flowers', 'g'],
];

/** Dara photos kept for the Grads gallery only (not part of the series story). */
const DARA_GALLERY: [n: number, alt: string][] = [
  [8, 'Close portrait of the graduate beside a red railing, the campus lawn soft behind her'],
  [11, 'A bouquet of white and yellow flowers with a florist’s card tucked in'],
  [12, 'Friends walk across the lawn with flowers while a graduation cap blurs in the foreground'],
  [15, 'The graduate and a friend lean over the red railing of a campus balcony'],
  [17, 'The graduate looks up at her tossed cap against a tall campus building'],
  [19, 'The graduate poses with her parents under the trees, her father lifting the flowers high'],
];

const daraId = (n: number) => `dara-grad-${pad(n)}`;
const daraPhotos: Photo[] = [
  ...DARA.map(([n, alt, flags = '']) =>
    real(daraId(n), 'grads', alt, {
      series: 'dara-grad',
      inGallery: flags.includes('g'),
      showreel: flags.includes('r'),
      consent: 'anonymize',
    }),
  ),
  ...DARA_GALLERY.map(([n, alt]) => real(daraId(n), 'grads', alt, { inGallery: true, consent: 'anonymize' })),
];

/** Series whose real photos are in; the rest still get placeholders. */
const REAL_SERIES = new Set(['dara-grad']);

const PHOTOS_PER_SERIES = 12;
const GALLERY_PICKS_PER_SERIES = 4;

const seriesPhotos: Photo[] = series.filter((s) => !REAL_SERIES.has(s.slug)).flatMap((s) =>
  Array.from({ length: PHOTOS_PER_SERIES }, (_, k) => {
    const n = k + 1;
    const consent = s.slug === 'love-story' ? 'anonymize' : 'ok';
    return placeholder(`${SERIES_PREFIX[s.slug]}-${pad(n)}`, s.roll, `${s.title}, frame ${n} (placeholder)`, k, {
      series: s.slug,
      chapter: s.chapters ? s.chapters[Math.floor(k / (PHOTOS_PER_SERIES / s.chapters.length))] : undefined,
      inGallery: k < GALLERY_PICKS_PER_SERIES,
      showreel: k === 0,
      consent,
    });
  }),
);

const EXTRA_GALLERY: Record<RollId, number> = { lover: 10, grads: 0, event: 2, product: 10, studio: 14 };

const galleryOnly: Photo[] = rolls.flatMap((r) =>
  Array.from({ length: EXTRA_GALLERY[r.id] }, (_, k) =>
    placeholder(`${r.id}-${pad(k + 1)}`, r.id, `${r.title} roll, frame ${k + 1} (placeholder)`, k + 1, {
      inGallery: true,
      showreel: k === 0,
    }),
  ),
);

export const contentData: ContentData = {
  rolls,
  series,
  photos: [...daraPhotos, ...seriesPhotos, ...galleryOnly],
};
