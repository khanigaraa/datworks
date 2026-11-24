import { catalog } from '../content';
import type { RouteContext } from '../router';
import { h } from '../ui/dom';
import { photoFigure } from '../ui/photo';

/** /work: the archive grid, filterable by roll through `?roll=`. */
export function workPage({ url }: RouteContext): HTMLElement {
  const param = url.searchParams.get('roll');
  const roll = catalog.isRoll(param) ? param : undefined;
  const photos = catalog.listPhotos({ roll });
  const active = catalog.listRolls().find((r) => r.id === roll);

  const filterLink = (href: string, label: string, current: boolean) =>
    h('a', { href, 'data-link': true, class: 'filter', 'aria-current': current ? 'true' : undefined }, label);

  const filters = h(
    'nav',
    { class: 'filters', 'aria-label': 'Filter by roll' },
    filterLink('/work', 'All', !roll),
    ...catalog.listRolls().map((r) => filterLink(`/work?roll=${r.id}`, r.title, r.id === roll)),
  );

  return h(
    'section',
    { class: 'page work', 'data-title': active ? active.title : 'Work' },
    h(
      'header',
      { class: 'page-head' },
      h('p', { class: 'eyebrow', 'data-reveal': true }, active ? `Roll · ${active.title}` : 'The archive'),
      h('h1', { class: 'display', 'data-reveal': true }, active ? active.title : 'Work'),
      h('p', { class: 'lede', 'data-reveal': true }, active ? active.blurb : 'Five rolls from the datworks archive.'),
      filters,
    ),
    h(
      'p',
      { class: 'count mono', 'aria-live': 'polite' },
      `${String(photos.length).padStart(2, '0')} frames`,
    ),
    h('div', { class: 'grid', 'data-hover-fx': true }, ...photos.map((p, i) => photoFigure(p, { frame: { n: i + 1, total: photos.length }, priority: i < 3 }))),
  );
}
