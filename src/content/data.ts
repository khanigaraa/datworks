import photoMeta from './photo-meta.json';
import type { Consent, ContentData, Photo, PhotoImage, Roll, RollId, Series } from './types';

/**
 * Content for the DARKROOM site: 114 curated photos from the datworks Drive.
 *
 * Every photo is processed by the image pipeline (`npm run photos`, driven by
 * scripts/photos.manifest.json → photo-meta.json). Ids are stable (`aquatics-11`), so the
 * curation can change without touching the original camera file names.
 * People-facing series stay anonymised (`clientLabel` alias, `consent: 'anonymize'`) until
 * datworks confirms consent; no real client names appear anywhere in the data.
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
    intro: 'Seasons poolside: swimming and diving across West Java championships, from the blocks to the podium.',
    cover: 'aquatics-11',
  },
  {
    slug: 'love-story',
    title: 'A Love Story in 4 Chapters',
    year: '2025',
    roll: 'lover',
    layout: 'chapters',
    clientLabel: 'A & D',
    intro: 'One couple, four sessions: from the engagement to the studio, told in order.',
    cover: 'love-story-05',
    chapters: ['Engagement', 'Pre-wedding', 'Wedding', 'Studio'],
    chapterNotes: {
      Engagement: 'Two families in one room, a long lunch on the carpet and a lot of laughing.',
      'Pre-wedding': 'Neon, graffiti and a late train across the city: the two of them before the big day.',
      Wedding: 'The vows, the jasmine, the confetti and the long table.',
      Studio: 'After it all, against a plain backdrop: just A & D.',
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
    year: '2024',
    roll: 'event',
    layout: 'blur',
    clientLabel: 'Silat Bumi Padjadjaran Championship',
    intro: 'Around the bouts: the packed stands, the officials and the ceremony of a pencak silat championship.',
    cover: 'silat-02',
  },
  {
    slug: 'ace-gathering-2025',
    title: 'ACE Gathering & Seminar',
    year: '2025',
    roll: 'event',
    layout: 'editorial',
    clientLabel: 'Asosiasi Chief Engineer Jawa Barat',
    intro: 'A corporate seminar documented like a feature, not a headcount: hands up, booths, music and a dancer.',
    cover: 'ace-01',
  },
  {
    slug: 'still-life',
    title: 'Still Life',
    year: '2025',
    roll: 'product',
    layout: 'catalog',
    clientLabel: 'Dua Dimsum · My Cookies · ITB Gitar Nusantara',
    intro: 'Dimsum, cookies and hand-carved guitars, catalogued frame by frame.',
    cover: 'still-life-11',
    chapters: ['Dua Dimsum', 'My Cookies', 'ITB Gitar Nusantara'],
  },
];

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Flags per photo: `g` = also in its roll's gallery on /work, `r` = in the Home showreel.
 * The third element of a series entry is the chapter (or catalog group), when the series has them.
 */
type Flags = '' | 'g' | 'r' | 'gr';
type Entry = [alt: string, flags?: Flags, chapter?: string];

function seriesPhotos(prefix: string, slug: string, roll: RollId, entries: Entry[], consent: Consent = 'ok'): Photo[] {
  return entries.map(([alt, flags = '', chapter], i) =>
    real(`${prefix}-${pad(i + 1)}`, roll, alt, {
      series: slug,
      chapter,
      inGallery: flags.includes('g'),
      showreel: flags.includes('r'),
      consent,
    }),
  );
}

function galleryPhotos(prefix: string, roll: RollId, entries: [alt: string, flags?: Flags][], consent: Consent = 'ok'): Photo[] {
  return entries.map(([alt, flags = 'g'], i) =>
    real(`${prefix}-${pad(i + 1)}`, roll, alt, { inGallery: true, showreel: flags.includes('r'), consent }),
  );
}

const aquatics = seriesPhotos('aquatics', 'west-java-aquatics', 'event', [
  ['A swimmer rests on the lane rope beside starting block number 9'],
  ['A swimmer adjusts his goggles against a bright, open sky'],
  ['Black and white: a swimmer stretches her arms wide before the race'],
  ['A swimmer crouches low on the starting block, ready to dive', 'g'],
  ['A butterfly swimmer surges out of the water, arms thrown forward', 'g'],
  ['A freestyle swimmer cuts through a turquoise lane'],
  ['Seen past a blurred yellow pillar, a swimmer streaks along the lane'],
  ['A swimmer climbs out of the pool up a steel ladder'],
  ['A swimmer in a yellow cap sits on the pool edge, catching his breath'],
  ['Two divers stand on the high platform under a cloud-streaked sky'],
  ['Two divers fall in perfect sync from the platform against a blue sky', 'gr'],
  ['A diver stretches out mid-air below the springboard'],
  ['Black and white: spectators cheer from behind the railings', 'g'],
  ['An official hangs a medal around a young swimmer’s neck'],
]);

const E = 'Engagement', P = 'Pre-wedding', W = 'Wedding', S = 'Studio';
const loveStory = seriesPhotos(
  'love-story',
  'love-story',
  'lover',
  [
    ['The couple sit on the carpet with family at the engagement, the bride-to-be laughing', 'g', E],
    ['Home-cooked dishes laid out on a floral tablecloth for the engagement guests', '', E],
    ['The bride-to-be in white laughs as she sits on the carpet', '', E],
    ['Two women from the family lean together on a red sofa, smiling', '', E],
    ['At night, the couple walk past a graffiti-covered shopfront lit in yellow', 'gr', P],
    ['The couple sit side by side on a commuter train', '', P],
    ['Black and white: the couple lean against a wall, her head tilted toward his', '', P],
    ['In warm wooden light, he stands by a doorway while she sits on the step', '', P],
    ['At the ceremony, the bride signs the marriage register while the groom looks on', 'g', W],
    ['The bride in a white kebaya and strands of jasmine stands by a garden lamp', '', W],
    ['Black and white: the newlyweds walk through a shower of confetti', 'g', W],
    ['The newlyweds sit behind a flower-decked table, smiling side by side', '', W],
    ['In the studio, the couple lean in close against a plain backdrop', '', S],
    ['He pulls a playful face behind her while she smiles at the camera', '', S],
    ['He lifts her into his arms, both of them laughing', 'g', S],
    ['A close, playful frame: her hand raised, his tongue out', 'g', S],
  ],
  'anonymize',
);

/**
 * Dara Grad, in story order: the details, the portraits on the red stairs, a black-and-white
 * pause, then friends and family. Ids are the original file numbers ("dara grad-04.jpg").
 */
const DARA: [n: number, alt: string, flags?: Flags][] = [
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
const dara = DARA.map(([n, alt, flags = '']) =>
  real(`dara-grad-${pad(n)}`, 'grads', alt, {
    series: 'dara-grad',
    inGallery: flags.includes('g'),
    showreel: flags.includes('r'),
    consent: 'anonymize',
  }),
);

const silat = seriesPhotos('silat', 'silat-bumi-padjadjaran', 'event', [
  ['The championship hall packed with spectators under a steel roof', 'g'],
  ['An official in a black vest bearing the championship emblem looks out over the crowd', 'gr'],
  ['Spectators in the stands follow the match intently'],
  ['A wide view of the hall: full stands and banners along the walls'],
  ['A man in an orange-and-black uniform watches from the front row'],
  ['A spectator raises his hands in front of the stage'],
  ['Officials present an award on stage beneath the championship banner'],
  ['A speaker addresses the hall from the podium under the steel roof'],
  ['Two women in orange and black smile together by the stage', 'g'],
  ['A woman in a black hijab and team jacket stands in the arena, the crowd soft behind her'],
  ['Officials gather around a carved traditional instrument on stage'],
  ['Black and white: an official in a white jacket bows his head'],
]);

const ace = seriesPhotos('ace', 'ace-gathering-2025', 'event', [
  ['A ballroom full of seminar guests raise their hands at once', 'gr'],
  ['A speaker in a suit presents on stage in front of the seminar backdrop'],
  ['A guest laughs as he lifts a plate high during the celebration'],
  ['An exhibitor in a blue cap demonstrates a product at his booth'],
  ['Black and white: a visitor leans over an exhibition stand'],
  ['Members of the organising team pose together in matching blue shirts'],
  ['A traditional dancer performs in front of the seminar banner', 'g'],
  ['The back of a blue jacket printed with the association’s web address'],
  ['Guests watch the session from their seats in the ballroom'],
  ['A band plays for the guests at the evening session', 'g'],
  ['A participant raises his arms on stage, holding a prize'],
  ['Three participants give a thumbs-up for the camera'],
]);

const D = 'Dua Dimsum', C = 'My Cookies', G = 'ITB Gitar Nusantara';
const stillLife = seriesPhotos('still-life', 'still-life', 'product', [
  ['Shumai with prawn and nori toppings arranged on a white plate', 'g', D],
  ['Overhead: a bamboo steamer of shumai topped with nori', 'g', D],
  ['Four bamboo steamers of assorted dimsum seen from above', 'g', D],
  ['A foil tray of shumai and tofu dimsum beside a brass lamp', '', D],
  ['A tray of baked dimsum scattered with sesame seeds', 'g', D],
  ['Chocolate cookies coated in white sesame on a wooden board', 'g', C],
  ['A tall stack of chocolate chip cookies beside a glass of milk', 'g', C],
  ['A branded box of cheese sticks with a cup of tea', '', C],
  ['Pineapple rolls piled into a pyramid on a white plate', 'g', C],
  ['Close-up of golden pineapple rolls on a cooling rack', 'g', C],
  ['Overhead: a guitarist sits in a ring of golden hand-carved guitars and amps', 'r', G],
  ['Close-up of a yellow axe-shaped bass guitar', 'g', G],
  ['Fingers on the fretboard of a gold bass, the inlays catching the light', 'g', G],
  ['Black and white: a ringed hand grips the carved neck of a guitar', 'g', G],
  ['A musician lifts a gold guitar overhead against a white studio wall', 'g', G],
]);

const lover = galleryPhotos('lover', 'lover', [
  ['In a wood-panelled diner booth, she reaches across the table to touch his face'],
  ['Black and white: two engagement rings rest on dark stones'],
  ['Close-up of a couple’s hands, rings and watches side by side'],
  ['A couple in sunglasses laugh together on a street corner'],
  ['A couple pose in front of an old noodle-shop sign', 'gr'],
  ['A couple look up beneath a bright orange shop sign'],
  ['He carries her piggyback past a half-open shutter'],
  ['Sharing a fried snack, she holds it up between their faces'],
]);

const grads = galleryPhotos(
  'grads',
  'grads',
  [
    ['A graduate in glasses and cap smiles between her parents', 'gr'],
    ['Black and white: her family kiss the graduate on both cheeks'],
    ['The graduate stands on the stairs holding her diploma folder'],
    ['Two graduates laugh together, one fixing the other’s gown'],
    ['Black and white: medals hanging on two graduation gowns'],
  ],
  'anonymize',
);

const event = galleryPhotos('event', 'event', [
  ['Colour guard members swing orange, flame-printed flags across a green court', 'gr'],
  ['A colour guard sweeps white flags in a wave across the floor'],
  ['A marching band forms a wall of white fans on the court'],
  ['Colour guard members rehearse outdoors with white flags, trees behind them'],
]);

const studio = galleryPhotos('studio', 'studio', [
  ['Studio portrait: a young woman in a white tee tilts her head toward the light'],
  ['Laughing, she runs a hand through her hair in warm studio light', 'gr'],
  ['Profile portrait in a white blouse against a warm backdrop'],
  ['Black and white: she smiles, a hand resting in her hair'],
  ['Seated low, she looks up with a hand in her hair'],
  ['Shot from above, she leans toward the camera, hands on her knees'],
  ['High-angle portrait: she sits and looks up into the lens'],
  ['From above, she smiles up at the camera'],
  ['She frames her face with both hands, grinning'],
  ['Behind a veil of red tulle, a woman looks into the camera'],
  ['Black and white: a woman laughs, an arm wrapped around her shoulder'],
  ['A woman with long dark hair poses in moody, low-key light'],
]);

export const contentData: ContentData = {
  rolls,
  series,
  photos: [...aquatics, ...loveStory, ...dara, ...silat, ...ace, ...stillLife, ...lover, ...grads, ...event, ...studio],
};
