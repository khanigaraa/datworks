import { catalog } from '../content';
import { site } from '../content/site';
import { h } from '../ui/dom';
import { photoFigure, photoFrame } from '../ui/photo';

/** Collage placement for showreel frames on wide screens: [column start, span, vertical offset]. */
const PLACEMENT: [number, number, string][] = [
  [1, 6, '0'],
  [8, 5, '14vw'],
  [3, 4, '-2vw'],
  [8, 4, '8vw'],
  [1, 5, '4vw'],
  [7, 6, '-6vw'],
];
const SPEEDS = [1, 2.2, 0.6, 1.6, 0.9, 2];

const pad = (n: number) => String(n).padStart(2, '0');

/** /: hero, the showreel collage, the five rolls and the six series. */
export function homePage(): HTMLElement {
  const reel = catalog.showreel();
  const rolls = catalog.listRolls();
  const series = catalog.listSeries();

  const reelItems = reel.map((p, i) => {
    const [col, span, offset] = PLACEMENT[i % PLACEMENT.length];
    return h(
      'div',
      {
        class: 'reel-item',
        'data-speed': SPEEDS[i % SPEEDS.length],
        style: `--col:${col} / span ${span};--offset:${offset}`,
      },
      photoFigure(p, { frame: { n: i + 1, total: reel.length } }),
    );
  });

  const rollLinks = rolls.map((r, i) =>
    h(
      'li',
      { 'data-reveal': true },
      h(
        'a',
        { href: `/work?roll=${r.id}`, 'data-link': true, class: 'roll-link' },
        h('span', { class: 'mono' }, pad(i + 1)),
        h('span', { class: 'roll-title' }, r.title),
        h('span', { class: 'roll-blurb' }, r.blurb),
        h('span', { class: 'mono' }, `${pad(catalog.listPhotos({ roll: r.id }).length)} frames`),
      ),
    ),
  );

  const seriesCards = series.map((s, i) => {
    const cover = catalog.getPhoto(s.cover);
    return h(
      'li',
      { 'data-reveal': true },
      h(
        'a',
        { href: `/series/${s.slug}`, 'data-link': true, class: 'series-card' },
        cover && h('div', { class: 'series-card-cover' }, photoFrame(cover, { ratio: '4/5', decorative: true, sizes: '(min-width: 900px) 30vw, 100vw' })),
        h('span', { class: 'mono' }, `${pad(i + 1)} · ${s.roll} · ${s.year}`),
        h('span', { class: 'series-card-title' }, s.title),
      ),
    );
  });

  return h(
    'div',
    { class: 'home' },
    h(
      'section',
      { class: 'page hero', 'aria-labelledby': 'hero-title' },
      h('p', { class: 'eyebrow', 'data-reveal': true }, `Photography · ${site.location}`),
      h(
        'h1',
        { class: 'hero-title', id: 'hero-title', 'data-reveal': true },
        'datworks',
        h('span', { class: 'brand-dot' }, '.'),
      ),
      h(
        'div',
        { class: 'hero-foot' },
        h('p', { class: 'hero-tagline', 'data-reveal': true }, h('em', {}, site.tagline)),
        h(
          'p',
          { class: 'lede', 'data-reveal': true },
          'Pre-wedding, graduation, event and product photography, developed in the dark and printed for the light.',
        ),
      ),
      h('p', { class: 'scroll-cue mono', 'aria-hidden': 'true' }, `Scroll · ${pad(reel.length)} frames from the reel ↓`),
    ),
    h(
      'section',
      { class: 'reel', 'aria-label': 'Showreel' },
      h('div', { class: 'reel-grid' }, ...reelItems),
    ),
    h(
      'section',
      { class: 'page home-rolls', 'aria-labelledby': 'rolls-title' },
      h('p', { class: 'eyebrow', 'data-reveal': true }, 'The archive'),
      h('h2', { class: 'section-title', id: 'rolls-title', 'data-reveal': true }, 'Five rolls'),
      h('ol', { class: 'roll-list' }, ...rollLinks),
    ),
    h(
      'section',
      { class: 'page home-series', 'aria-labelledby': 'series-title' },
      h('p', { class: 'eyebrow', 'data-reveal': true }, 'Stories'),
      h('h2', { class: 'section-title', id: 'series-title', 'data-reveal': true }, 'Six series'),
      h('ol', { class: 'series-cards' }, ...seriesCards),
      h('a', { href: '/work', 'data-link': true, class: 'cta' }, 'See the whole archive →'),
    ),
  );
}
