import type { Photo } from '../content';
import { h } from './dom';

export interface PhotoOptions {
  /** Contact-sheet label, e.g. `FRAME 07/12 · GRADS`. */
  frame?: { n: number; total: number };
  /** Crop to a fixed ratio (catalog grids) instead of the photo's own aspect ratio. */
  crop?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const frameLabel = (n: number, total: number) => `Frame ${pad(n)}/${pad(total)}`;

/**
 * The picture itself. Until the image pipeline (ticket 02) exists, this is a toned
 * placeholder with the real aspect ratio and alt text, so layouts don't shift later.
 */
export function photoFrame(
  photo: Photo,
  ratio = `${photo.width}/${photo.height}`,
  { decorative = false } = {},
): HTMLElement {
  return h('div', {
    class: 'photo-frame',
    role: decorative ? undefined : 'img',
    'aria-label': decorative ? undefined : photo.alt,
    'aria-hidden': decorative ? 'true' : undefined,
    style: `aspect-ratio:${ratio};--tone:${photo.tone ?? 0}`,
  });
}

/**
 * A photo in a grid or series: the frame wrapped in a button that opens the lightbox
 * (the lightbox picks it up by `data-photo`), plus thin crop marks and a frame label.
 */
export function photoFigure(photo: Photo, opts: PhotoOptions = {}): HTMLElement {
  const open = h(
    'button',
    { type: 'button', class: 'photo-open', 'data-photo': photo.id, 'aria-label': `Open photo: ${photo.alt}` },
    photoFrame(photo, opts.crop),
    h('span', { class: 'crop-marks', 'aria-hidden': 'true' }),
  );
  const caption =
    opts.frame &&
    h(
      'figcaption',
      { class: 'frame-label mono', 'aria-hidden': 'true' },
      h('span', {}, frameLabel(opts.frame.n, opts.frame.total)),
      h('span', {}, photo.roll),
    );
  return h(
    'figure',
    { class: 'photo', 'data-reveal': true, 'data-roll': photo.roll, 'data-photo': photo.id },
    open,
    caption,
  );
}
