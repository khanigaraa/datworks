import { catalog } from '../content';
import type { RouteContext } from '../router';
import { h } from '../ui/dom';

/** Temporary home until ticket 05 builds the showreel and preloader. */
export function homePage(): HTMLElement {
  return h(
    'section',
    { class: 'page home-stub' },
    h('p', { class: 'eyebrow', 'data-reveal': true }, 'datworks · The King of All Trades'),
    h('h1', { class: 'display', 'data-reveal': true }, 'Darkroom'),
    h('p', { class: 'lede', 'data-reveal': true }, 'Pre-wedding, graduation, event and product photography from West Java.'),
    h('a', { href: '/work', 'data-link': true, class: 'cta' }, 'Enter the archive →'),
  );
}

/** Temporary series page until ticket 06 builds the series template. */
export function seriesPage(ctx: RouteContext): HTMLElement {
  const s = catalog.getSeries(ctx.params.slug);
  if (!s) return notFoundPage();
  const next = catalog.nextSeries(s.slug);
  return h(
    'section',
    { class: 'page series-stub', 'data-title': s.title },
    h('p', { class: 'eyebrow', 'data-reveal': true }, `Series · ${s.roll} · ${s.year}`),
    h('h1', { class: 'display', 'data-reveal': true }, s.title),
    h('p', { class: 'lede', 'data-reveal': true }, s.intro),
    h('p', { class: 'mono stub-note', 'data-reveal': true }, 'Still in the developing tray. Full series coming soon.'),
    next && h('a', { href: `/series/${next.slug}`, 'data-link': true, class: 'cta' }, `Next series: ${next.title} →`),
  );
}

export function notFoundPage(): HTMLElement {
  return h(
    'section',
    { class: 'page not-found', 'data-title': 'Frame missing' },
    h('div', { class: 'safelight', 'aria-hidden': 'true' }),
    h('p', { class: 'eyebrow mono' }, 'Error 404 · Frame ??/36'),
    h('h1', { class: 'display' }, "This frame hasn't been developed yet."),
    h('p', { class: 'lede' }, 'The negative you asked for is still in the tray, or never made it to the roll.'),
    h(
      'div',
      { class: 'not-found-links' },
      h('a', { href: '/work', 'data-link': true, class: 'cta' }, 'Back to the archive →'),
      h('a', { href: '/', 'data-link': true, class: 'cta cta-quiet' }, 'Home'),
    ),
  );
}
