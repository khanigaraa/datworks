import { catalog, type Photo, type Series, type SeriesLayout } from '../content';
import type { RouteContext } from '../router';
import { scrollToElement } from '../motion';
import { h, onTeardown } from '../ui/dom';
import { editorialRows } from '../ui/editorial';
import { COVER_SIZES, photoFigure } from '../ui/photo';
import { notFoundPage } from './simple';

type Layout = (series: Series, photos: Photo[], frame: (p: Photo) => HTMLElement) => HTMLElement;

/** Big frames alternating with pairs and offset singles, like a magazine spread. */
const editorial: Layout = (_s, photos, frame) =>
  h(
    'div',
    { class: 'layout-editorial' },
    ...editorialRows(photos).map((row) => h('div', { class: `ed-row ed-${row.kind}` }, ...row.items.map(frame))),
  );

/** A tidy contact-sheet grid per product group (the series' `chapters`). */
const catalogLayout: Layout = (s, photos, frame) => {
  const groups = s.chapters?.length
    ? catalog.seriesChapters(s.slug).map((g) => ({ ...g, photos: g.photos.filter((p) => photos.includes(p)) }))
    : [{ chapter: s.title, photos }];
  return h(
    'div',
    { class: 'layout-catalog' },
    ...groups.map((g, i) =>
      h(
        'section',
        { class: 'catalog-group', 'aria-labelledby': `group-${i}` },
        h(
          'header',
          { class: 'catalog-head', 'data-reveal': true },
          h('span', { class: 'mono' }, String.fromCharCode(65 + i)),
          h('h2', { id: `group-${i}` }, g.chapter),
          h('span', { class: 'mono' }, `${g.photos.length} frames`),
        ),
        h('div', { class: 'catalog-grid' }, ...g.photos.map(frame)),
      ),
    ),
  );
};

const pad = (n: number) => String(n).padStart(2, '0');
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
/** Background hue per chapter: blush, gold, candlelight, studio blue. */
const CHAPTER_TONES = [350, 32, 45, 215];

/**
 * A story in chapters: a sticky chapter index that follows the reader, and a background
 * that shifts tone from one chapter to the next (the colour transition is CSS, so
 * reduced motion turns it off).
 */
const chaptersLayout: Layout = (s, photos, frame) => {
  const groups = catalog
    .seriesChapters(s.slug)
    .map((g) => ({ ...g, photos: g.photos.filter((p) => photos.includes(p)) }));

  const links = groups.map((g, i) =>
    h(
      'a',
      { href: `#chapter-${slugify(g.chapter)}`, 'data-chapter': g.chapter },
      h('span', { class: 'mono' }, pad(i + 1)),
      h('span', { class: 'chapter-link-name' }, g.chapter),
    ),
  );

  const sections = groups.map((g, i) => {
    const id = `chapter-${slugify(g.chapter)}`;
    const note = s.chapterNotes?.[g.chapter];
    return h(
      'section',
      {
        class: 'chapter',
        id,
        'data-chapter': g.chapter,
        'data-tone': CHAPTER_TONES[i % CHAPTER_TONES.length],
        'aria-labelledby': `${id}-title`,
        tabindex: -1,
      },
      h(
        'header',
        { class: 'chapter-head' },
        h('p', { class: 'eyebrow', 'data-reveal': true }, `Chapter ${pad(i + 1)} / ${pad(groups.length)}`),
        h('h2', { class: 'chapter-title', id: `${id}-title`, 'data-reveal': true }, g.chapter),
        note && h('p', { class: 'lede', 'data-reveal': true }, note),
      ),
      editorial(s, g.photos, frame),
    );
  });

  const nav = h('nav', { class: 'chapter-nav', 'aria-label': 'Chapters' }, h('ol', {}, ...links.map((a) => h('li', {}, a))));
  const root = h('div', { class: 'layout-chapters' }, nav, ...sections);

  function setActive(section: HTMLElement) {
    for (const a of links) {
      if (a.dataset.chapter === section.dataset.chapter) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
    root.dataset.active = section.dataset.chapter;
    root.closest<HTMLElement>('.series')?.style.setProperty('--chapter-tone', section.dataset.tone ?? '0');
  }

  // A chapter is "active" while it crosses the middle band of the viewport.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target as HTMLElement);
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((sec) => observer.observe(sec));
  onTeardown(root, () => observer.disconnect());
  if (sections[0]) setActive(sections[0]);

  // Jump with the smooth scroller instead of a hash change, then move focus for keyboard users.
  nav.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-chapter]');
    if (!a) return;
    e.preventDefault();
    const target = sections.find((sec) => sec.dataset.chapter === a.dataset.chapter)!;
    scrollToElement(target);
    target.focus({ preventScroll: true });
  });

  return root;
};

/**
 * A pool-length strip of frames. Desktop: the section pins and vertical scrolling drives
 * the strip sideways (wired up in motion.ts via `data-horizontal`), with a water-ripple
 * shader on top. Phones: native swipe with snap points. Reduced motion: a plain grid.
 */
const horizontal: Layout = (s, photos, frame) =>
  h(
    'section',
    { class: 'layout-horizontal', 'data-horizontal': true, 'aria-label': `${s.title}, frames` },
    h(
      'div',
      { class: 'h-track' },
      h(
        'div',
        { class: 'h-card' },
        h('p', { class: 'mono' }, `Lanes 01–${pad(photos.length)}`),
        h('p', { class: 'h-card-title' }, 'Keep scrolling to swim across.'),
        h('p', { class: 'mono h-hint', 'aria-hidden': 'true' }, 'Scroll ↓ · Swipe →'),
      ),
      ...photos.map((p) => h('div', { class: 'h-item' }, frame(p))),
      h(
        'div',
        { class: 'h-card' },
        h('p', { class: 'mono' }, 'Finish'),
        h('p', { class: 'h-card-title' }, `${photos.length} frames, ${s.year}.`),
      ),
    ),
  );

/**
 * Pencak silat in motion: a staggered two-column sequence. Scroll speed leans and blurs
 * the frames (motion.ts, `data-velocity-fx`); they sharpen as soon as you stop.
 */
const blur: Layout = (_s, photos, frame) =>
  h(
    'div',
    { class: 'layout-blur', 'data-velocity-fx': true },
    ...photos.map((p, i) => h('div', { class: `blur-item blur-item-${i % 2 ? 'right' : 'left'}` }, frame(p))),
  );

/**
 * One renderer per layout.
 */
const LAYOUTS: Record<SeriesLayout, Layout> = {
  editorial,
  catalog: catalogLayout,
  horizontal,
  chapters: chaptersLayout,
  blur,
};

/** Rough rendered width of a frame in each layout, so browsers pick the right file. */
const SIZES: Record<SeriesLayout, string> = {
  editorial: '(min-width: 900px) 70vw, 100vw',
  chapters: '(min-width: 900px) 70vw, 100vw',
  catalog: '(min-width: 900px) 25vw, 50vw',
  horizontal: '(min-width: 900px) 60vw, 85vw',
  blur: '(min-width: 640px) 45vw, 100vw',
};

/** /series/:slug: one template for every series; the body layout comes from the data. */
export function seriesPage({ params }: RouteContext): HTMLElement {
  const s = catalog.getSeries(params.slug);
  if (!s) return notFoundPage();

  const all = catalog.listSeries();
  const index = all.findIndex((x) => x.slug === s.slug);
  const photos = catalog.seriesPhotos(s.slug);
  const cover = catalog.getPhoto(s.cover);
  const roll = catalog.listRolls().find((r) => r.id === s.roll);
  const next = catalog.nextSeries(s.slug);

  const crop = s.layout === 'catalog' ? '4/5' : undefined;
  const sizes = SIZES[s.layout];
  const frame = (p: Photo) =>
    photoFigure(p, { frame: { n: photos.indexOf(p) + 1, total: photos.length }, crop, sizes });
  const body = photos.filter((p) => p !== cover);

  const meta = (label: string, value: string) => h('div', {}, h('dt', { class: 'mono' }, label), h('dd', {}, value));

  return h(
    'article',
    { class: `page series series-${s.layout}`, 'data-title': s.title, 'data-series': s.slug, 'data-layout': s.layout },
    h(
      'header',
      { class: 'series-head' },
      h(
        'p',
        { class: 'eyebrow', 'data-reveal': true },
        `Series ${String(index + 1).padStart(2, '0')}/${String(all.length).padStart(2, '0')}`,
      ),
      h('h1', { class: 'display', 'data-reveal': true }, s.title),
      h(
        'dl',
        { class: 'series-meta', 'data-reveal': true },
        meta('Client', s.clientLabel),
        meta('Roll', roll?.title ?? s.roll),
        meta('Year', s.year),
        meta('Frames', String(photos.length).padStart(2, '0')),
      ),
      h('p', { class: 'lede series-intro', 'data-reveal': true }, s.intro),
    ),
    cover &&
      h(
        'div',
        { class: 'series-cover' },
        photoFigure(cover, { frame: { n: photos.indexOf(cover) + 1, total: photos.length }, crop, sizes: COVER_SIZES, priority: true }),
      ),
    LAYOUTS[s.layout](s, body, frame),
    next &&
      h(
        'footer',
        { class: 'series-next' },
        h('p', { class: 'eyebrow' }, 'Next series'),
        h(
          'a',
          { href: `/series/${next.slug}`, 'data-link': true, class: 'next-link', 'aria-label': `Next series: ${next.title}` },
          h('span', { class: 'next-title' }, next.title),
          h('span', { class: 'next-arrow', 'aria-hidden': 'true' }, '→'),
        ),
        h('p', { class: 'mono' }, `${next.roll} · ${next.year}`),
      ),
  );
}
