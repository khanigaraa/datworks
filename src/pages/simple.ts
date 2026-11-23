import { h } from '../ui/dom';

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
