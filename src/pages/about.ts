import { catalog } from '../content';
import { site } from '../content/site';
import { h } from '../ui/dom';

const SERVICES: Record<string, string> = {
  lover: 'Engagement, pre-wedding & wedding',
  grads: 'Graduation portraits',
  event: 'Sport, stage & corporate events',
  product: 'Product & food photography',
  studio: 'Studio backdrop portraits',
};

/** /about: who datworks is, what they shoot, how to reach them. */
export function aboutPage(): HTMLElement {
  const services = catalog.listRolls().map((r, i) =>
    h(
      'li',
      { 'data-reveal': true },
      h('span', { class: 'mono' }, String(i + 1).padStart(2, '0')),
      h('a', { href: `/work?roll=${r.id}`, 'data-link': true }, SERVICES[r.id] ?? r.title),
    ),
  );

  return h(
    'section',
    { class: 'page about', 'data-title': 'About' },
    h(
      'header',
      { class: 'page-head' },
      h('p', { class: 'eyebrow', 'data-reveal': true }, `About · ${site.location}`),
      h('h1', { class: 'display', 'data-reveal': true }, 'The King of ', h('em', {}, 'All Trades')),
    ),
    h(
      'div',
      { class: 'about-body' },
      h(
        'div',
        { class: 'about-text' },
        h(
          'p',
          { class: 'about-lead', 'data-reveal': true },
          'datworks is a photography studio from West Java that shoots a little bit of everything, and treats every job like it matters: a couple’s first chapter, a graduate’s long-awaited day, a championship final, a plate of dimsum.',
        ),
        h(
          'p',
          { 'data-reveal': true },
          'No single genre, one consistent eye: honest light, patient timing and edits that still look like the moment did.',
        ),
      ),
      h(
        'div',
        { class: 'about-services' },
        h('h2', { class: 'eyebrow', 'data-reveal': true }, 'Services'),
        h('ol', { class: 'services' }, ...services),
      ),
    ),
    h(
      'div',
      { class: 'contact', 'data-reveal': true },
      h('h2', { class: 'contact-title' }, 'Book a session'),
      h(
        'div',
        { class: 'contact-links' },
        h('a', { class: 'button', href: site.instagram.url, target: '_blank', rel: 'noopener' }, `Instagram ${site.instagram.label}`),
        h('a', { class: 'button button-ghost', href: site.whatsapp.url, target: '_blank', rel: 'noopener' }, site.whatsapp.label),
      ),
    ),
    h(
      'footer',
      { class: 'colophon mono' },
      h('span', {}, site.history),
      h('span', {}, 'Site by ', h('a', { href: site.builtBy.url, target: '_blank', rel: 'noopener' }, site.builtBy.label)),
    ),
  );
}
