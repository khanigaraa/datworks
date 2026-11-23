import { h } from '../ui/dom';

/** Temporary home until ticket 05 builds the showreel and preloader. */
export function homePage(): HTMLElement {
  return h(
    'section',
    { class: 'page home-stub' },
    h('p', { class: 'eyebrow' }, 'datworks · The King of All Trades'),
    h('h1', { class: 'display' }, 'Darkroom'),
    h('p', { class: 'lede' }, 'Pre-wedding, graduation, event and product photography from West Java.'),
    h('a', { href: '/work', 'data-link': true, class: 'cta' }, 'Enter the archive →'),
  );
}

export function notFoundPage(): HTMLElement {
  return h(
    'section',
    { class: 'page not-found' },
    h('p', { class: 'eyebrow mono' }, 'Error 404 · Frame missing'),
    h('h1', { class: 'display' }, "This frame hasn't been developed yet."),
    h('a', { href: '/work', 'data-link': true, class: 'cta' }, 'Back to the archive →'),
  );
}
