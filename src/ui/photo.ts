import type { Photo } from '../content';
import { h } from './dom';

export interface PhotoOptions {
  /** Contact-sheet label, e.g. `FRAME 07/12 · GRADS`. */
  frame?: { n: number; total: number };
  /** Crop to a fixed ratio (catalog grids) instead of the photo's own aspect ratio. */
  crop?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Renders one photo. Until the image pipeline (ticket 02) exists, this is a toned
 * placeholder with the real aspect ratio and alt text, so layouts don't shift later.
 */
export function photoFigure(photo: Photo, opts: PhotoOptions = {}): HTMLElement {
  const ratio = opts.crop ?? `${photo.width}/${photo.height}`;
  const frame = h('div', {
    class: 'photo-frame',
    role: 'img',
    'aria-label': photo.alt,
    style: `aspect-ratio:${ratio};--tone:${photo.tone ?? 0}`,
  });
  const caption =
    opts.frame &&
    h(
      'figcaption',
      { class: 'frame-label mono', 'aria-hidden': 'true' },
      h('span', {}, `Frame ${pad(opts.frame.n)}/${pad(opts.frame.total)}`),
      h('span', {}, photo.roll),
    );
  return h(
    'figure',
    { class: 'photo', 'data-reveal': true, 'data-roll': photo.roll, 'data-photo': photo.id },
    frame,
    caption,
  );
}
