import { catalog } from '../content';
import { site } from '../content/site';
import { h } from './dom';

const MAIN_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
];

const external = (href: string, label: string) => h('a', { href, target: '_blank', rel: 'noopener' }, label);

/**
 * Site header with a full-screen index menu (Home, Work, About and the six series).
 * The menu works the same on desktop and phones; desktop also gets inline Work/About links.
 */
export function createShell(header: HTMLElement, opts: { onToggle(open: boolean): void }) {
  const toggle = h(
    'button',
    { class: 'menu-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'site-menu' },
    h('span', { class: 'menu-toggle-label' }, 'Index'),
    h('span', { class: 'menu-toggle-dot', 'aria-hidden': 'true' }),
  );

  const inline = h(
    'nav',
    { class: 'header-nav', 'aria-label': 'Main' },
    h('a', { href: '/work', 'data-link': true }, 'Work'),
    h('a', { href: '/about', 'data-link': true }, 'About'),
    toggle,
  );

  const seriesLinks = catalog.listSeries().map((s, i) =>
    h(
      'li',
      {},
      h(
        'a',
        { href: `/series/${s.slug}`, 'data-link': true },
        h('span', { class: 'menu-no mono' }, String(i + 1).padStart(2, '0')),
        h('span', { class: 'menu-series-title' }, s.title),
        h('span', { class: 'menu-meta mono' }, `${s.roll} · ${s.year}`),
      ),
    ),
  );

  const menu = h(
    'div',
    { class: 'menu', id: 'site-menu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Site index' },
    h(
      'div',
      { class: 'menu-inner' },
      h(
        'nav',
        { class: 'menu-main', 'aria-label': 'Pages' },
        h('p', { class: 'eyebrow' }, 'Pages'),
        h('ul', {}, ...MAIN_LINKS.map((l) => h('li', {}, h('a', { href: l.href, 'data-link': true }, l.label)))),
      ),
      h(
        'nav',
        { class: 'menu-series', 'aria-label': 'Series' },
        h('p', { class: 'eyebrow' }, 'Series'),
        h('ol', {}, ...seriesLinks),
      ),
      h(
        'div',
        { class: 'menu-foot mono' },
        external(site.instagram.url, 'Instagram'),
        external(site.whatsapp.url, 'WhatsApp'),
        h('span', {}, site.tagline),
      ),
    ),
  );

  header.replaceChildren(
    h('a', { class: 'brand', href: '/', 'data-link': true }, 'datworks', h('span', { class: 'brand-dot' }, '.')),
    inline,
  );
  header.after(menu);

  let open = false;
  function setOpen(next: boolean, { restoreFocus = true } = {}) {
    if (next === open) return;
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle-label')!.textContent = open ? 'Close' : 'Index';
    document.body.classList.toggle('menu-open', open);
    if (open) menu.setAttribute('data-open', '');
    else menu.removeAttribute('data-open');
    opts.onToggle(open);
    if (open) menu.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    else if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => setOpen(!open));
  // A menu link navigates (the router focuses the new page), so don't pull focus back.
  menu.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setOpen(false, { restoreFocus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      // Keep focus inside the open menu (plus its toggle button).
      const items = [toggle, ...menu.querySelectorAll<HTMLElement>('a')];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
      e.preventDefault();
      items[next].focus();
    }
  });

  return {
    /** Mark the links for the current page and close the menu after a navigation. */
    setActive(pathname: string) {
      for (const a of [...header.querySelectorAll('a'), ...menu.querySelectorAll('a')]) {
        if (!(a instanceof HTMLAnchorElement) || !a.hasAttribute('data-link')) continue;
        const current = a.pathname === pathname || (a.pathname !== '/' && pathname.startsWith(`${a.pathname}/`));
        if (current) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
      setOpen(false, { restoreFocus: false });
    },
  };
}
