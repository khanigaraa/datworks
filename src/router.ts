import { teardown } from './ui/dom';

export interface RouteContext {
  url: URL;
  params: Record<string, string>;
  /** Replace the current URL (e.g. a filter change) and re-render without a new history entry. */
  navigate(to: string, opts?: { replace?: boolean }): void;
}

export type Page = (ctx: RouteContext) => HTMLElement;

/**
 * Lifecycle hooks so motion stays out of the router. A path change runs
 * `leave` → `unmount` → swap → `enter`; a query-only change (e.g. a filter) skips `leave`.
 */
export interface RouterHooks {
  /** Cover the old page (page transition). Resolves when it's safe to swap. */
  leave?(): Promise<void>;
  /** Tear down the old page: kill animations, scroll triggers, listeners. */
  unmount?(): void;
  /** Called after the new page is in the DOM. `transition` is false on first load and query-only changes. */
  enter?(el: HTMLElement, info: { url: URL; transition: boolean }): void;
  /** Jump to the top of a new page (smooth-scroll libraries need their own call). */
  scrollTop?(): void;
}

interface Route {
  pattern: RegExp;
  keys: string[];
  page: Page;
}

const SITE_TITLE = 'datworks: Darkroom';

/**
 * Minimal History API router. Pages are pure functions returning an element; the router
 * swaps it into the outlet. Links opt in with `data-link`; back/forward re-render via popstate.
 * A page can set `data-title` on its root element to name the browser tab.
 */
export function createRouter(outlet: HTMLElement, notFound: Page, hooks: RouterHooks = {}) {
  const routes: Route[] = [];
  let renderedPath: string | null = null;
  let renderedKey: string | null = null;
  let seq = 0;
  let done = 0;

  function add(path: string, page: Page) {
    const keys: string[] = [];
    const pattern = new RegExp(
      '^' + path.replace(/\/:([a-z]+)/gi, (_, k: string) => (keys.push(k), '/([^/]+)')) + '/?$',
    );
    routes.push({ pattern, keys, page });
    return api;
  }

  function match(pathname: string): { page: Page; params: Record<string, string> } {
    for (const r of routes) {
      const m = r.pattern.exec(pathname);
      if (m) {
        const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        return { page: r.page, params };
      }
    }
    return { page: notFound, params: {} };
  }

  async function render() {
    // In-page anchors (#chapter-…, the skip link) fire popstate too: same page, nothing to do.
    // Unless another render is still in flight, in which case this one must win.
    if (location.pathname + location.search === renderedKey && done === seq) return;
    const token = ++seq;
    const pathChanged = renderedPath !== null && renderedPath !== location.pathname;

    if (pathChanged && hooks.leave) await hooks.leave();
    // A newer navigation started while the old page was leaving: let that one render.
    if (token !== seq) return;

    const url = new URL(location.href);
    const { page, params } = match(url.pathname);
    const el = page({ url, params, navigate });

    hooks.unmount?.();
    if (outlet.firstElementChild) teardown(outlet.firstElementChild);
    outlet.replaceChildren(el);
    document.title = el.dataset.title ? `${el.dataset.title} · datworks` : SITE_TITLE;

    if (pathChanged) {
      if (hooks.scrollTop) hooks.scrollTop();
      else window.scrollTo(0, 0);
      outlet.focus({ preventScroll: true });
    }
    renderedPath = url.pathname;
    renderedKey = url.pathname + url.search;
    done = token;
    hooks.enter?.(el, { url, transition: pathChanged });
  }

  function navigate(to: string, opts: { replace?: boolean } = {}) {
    const target = new URL(to, location.href);
    if (target.href === location.href) return;
    history[opts.replace ? 'replaceState' : 'pushState'](null, '', target);
    void render();
  }

  function onClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-link]');
    if (!a || a.target || a.origin !== location.origin) return;
    e.preventDefault();
    navigate(a.href);
  }

  function start() {
    history.scrollRestoration = 'manual';
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', () => void render());
    void render();
  }

  const api = { add, start, navigate };
  return api;
}
