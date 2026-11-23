import { catalog, type Photo } from '../content';
import { h } from './dom';
import { frameLabel, photoFrame } from './photo';

/** Wraps an index around a list of `n` items. */
export const wrapIndex = (i: number, n: number) => ((i % n) + n) % n;

/** -1 (previous), 1 (next) or 0 for a pointer gesture; ignores short or mostly vertical moves. */
export function swipeStep(dx: number, dy: number, threshold = 50): -1 | 0 | 1 {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}

/**
 * One shared lightbox for every gallery. Clicking any `.photo-open` button opens it with
 * all photos of the current page, in page order. Built on <dialog>: showModal() makes the
 * rest of the page inert (the focus trap) and Escape closes it; focus goes back to the trigger.
 */
export function createLightbox(root: HTMLElement, opts: { onToggle(open: boolean): void }) {
  const stage = h('div', { class: 'lb-stage' });
  const label = h('p', { class: 'lb-frame mono' });
  const alt = h('p', { class: 'lb-alt' });
  const btn = (cls: string, text: string, aria: string) =>
    h('button', { type: 'button', class: `lb-btn ${cls}`, 'aria-label': aria }, text);
  const prev = btn('lb-prev', '←', 'Previous photo');
  const next = btn('lb-next', '→', 'Next photo');
  const close = btn('lb-close', 'Close', 'Close photo viewer');

  const dialog = h(
    'dialog',
    { class: 'lightbox', 'aria-label': 'Photo viewer' },
    h('div', { class: 'lb-top' }, label, close),
    stage,
    h('div', { class: 'lb-bottom' }, prev, alt, next),
  );
  document.body.append(dialog);

  let photos: Photo[] = [];
  let index = 0;
  let trigger: HTMLElement | null = null;

  function show(i: number) {
    index = wrapIndex(i, photos.length);
    const p = photos[index];
    stage.replaceChildren(photoFrame(p, { sizes: '100vw', eager: true }));
    stage.classList.remove('lb-swap');
    void stage.offsetWidth; // restart the swap animation
    stage.classList.add('lb-swap');
    label.textContent = `${frameLabel(index + 1, photos.length)} · ${p.roll}`;
    alt.textContent = p.alt;
    dialog.dataset.photo = p.id;
  }

  function open(button: HTMLElement) {
    const buttons = [...root.querySelectorAll<HTMLElement>('.photo-open')];
    photos = buttons.map((b) => catalog.getPhoto(b.dataset.photo!)).filter((p): p is Photo => !!p);
    const start = photos.findIndex((p) => p.id === button.dataset.photo);
    if (start === -1) return;
    trigger = button;
    show(start);
    dialog.showModal();
    opts.onToggle(true);
    close.focus();
  }

  root.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLElement>('.photo-open');
    if (button) open(button);
  });

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  close.addEventListener('click', () => dialog.close());
  // A click on the dialog box itself (not its content) is a click on the backdrop.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'Tab') {
      // showModal() keeps focus off the page, but Tab could still escape to the browser UI.
      const items = [close, prev, next];
      const i = items.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      items[e.shiftKey ? wrapIndex(i - 1, items.length) : wrapIndex(i + 1, items.length)].focus();
    }
  });
  dialog.addEventListener('close', () => {
    opts.onToggle(false);
    trigger?.focus({ preventScroll: true });
    trigger = null;
  });

  let start: { x: number; y: number } | null = null;
  stage.addEventListener('pointerdown', (e) => (start = { x: e.clientX, y: e.clientY }));
  stage.addEventListener('pointerup', (e) => {
    if (!start) return;
    const step = swipeStep(e.clientX - start.x, e.clientY - start.y);
    start = null;
    if (step) show(index + step);
  });

  return {
    /** Close without animation, e.g. when the page changes underneath. */
    close: () => dialog.open && dialog.close(),
  };
}
