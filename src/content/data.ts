import type { ContentData, Photo, Roll, RollId, Series } from './types';

/**
 * Content for the DARKROOM site.
 *
 * Until real photos are processed (ticket 02) and fully curated (ticket 11), photos are
 * dark placeholders generated below. Their ids already follow the final naming scheme.
 * Client-facing series stay anonymised (`clientLabel` alias) until datworks confirms consent.
 */

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
    cover: 'dara-grad-01',
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

const PHOTOS_PER_SERIES = 12;
const GALLERY_PICKS_PER_SERIES = 4;

const seriesPhotos: Photo[] = series.flatMap((s) =>
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

const EXTRA_GALLERY: Record<RollId, number> = { lover: 10, grads: 10, event: 2, product: 10, studio: 14 };

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
  photos: [...seriesPhotos, ...galleryOnly],
};
