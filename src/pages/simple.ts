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
