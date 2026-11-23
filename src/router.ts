export interface RouteContext {
  url: URL;
  params: Record<string, string>;
  /** Replace the current URL (e.g. a filter change) and re-render without a new history entry. */
  navigate(to: string, opts?: { replace?: boolean }): void;
}

export type Page = (ctx: RouteContext) => HTMLElement;

interface Route {
  pattern: RegExp;
  keys: string[];
  page: Page;
}

/**
 * Minimal History API router. Pages are pure functions returning an element; the router
 * swaps it into the outlet. Links opt in with `data-link`; back/forward re-render via popstate.
 * Page transitions (ticket 04) will hook into `render`.
 */
export function createRouter(outlet: HTMLElement, notFound: Page) {
  const routes: Route[] = [];

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

  function render() {
    const url = new URL(location.href);
    const { page, params } = match(url.pathname);
    outlet.replaceChildren(page({ url, params, navigate }));
  }

  function navigate(to: string, opts: { replace?: boolean } = {}) {
    const target = new URL(to, location.href);
    if (target.href === location.href) return;
    const samePath = target.pathname === location.pathname;
    history[opts.replace ? 'replaceState' : 'pushState'](null, '', target);
    render();
    if (!samePath) {
      window.scrollTo(0, 0);
      outlet.focus({ preventScroll: true });
    }
  }

  function onClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-link]');
    if (!a || a.target || a.origin !== location.origin) return;
    e.preventDefault();
    navigate(a.href);
  }

  function start() {
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', render);
    render();
  }

  const api = { add, start, navigate };
  return api;
}
