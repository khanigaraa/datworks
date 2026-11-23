import { catalog, type Photo, type Series, type SeriesLayout } from '../content';
import type { RouteContext } from '../router';
import { h } from '../ui/dom';
import { editorialRows } from '../ui/editorial';
import { photoFigure } from '../ui/photo';
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

/**
 * One renderer per layout. Layouts that don't have their own ticket done yet
 * (horizontal: 07, chapters: 08, blur: 09) fall back to editorial.
 */
const LAYOUTS: Record<SeriesLayout, Layout> = {
  editorial,
  catalog: catalogLayout,
  horizontal: editorial,
  chapters: editorial,
  blur: editorial,
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
  const frame = (p: Photo) => photoFigure(p, { frame: { n: photos.indexOf(p) + 1, total: photos.length }, crop });
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
    cover && h('div', { class: 'series-cover' }, frame(cover)),
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
