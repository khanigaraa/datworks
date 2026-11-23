type Attrs = Record<string, string | number | boolean | undefined>;

/** Tiny element helper: `h('a', { href: '/work' }, 'Work')`. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

const teardowns = new Map<Element, (() => void)[]>();

/**
 * Register cleanup for an element (observers, listeners). The router calls `teardown(page)`
 * when a page leaves, which runs the cleanup of the page and everything inside it.
 */
export function onTeardown(el: Element, fn: () => void) {
  teardowns.set(el, [...(teardowns.get(el) ?? []), fn]);
}

export function teardown(root: Element) {
  for (const [el, fns] of teardowns) {
    if (!root.contains(el)) continue;
    for (const fn of fns) fn();
    teardowns.delete(el);
  }
}
