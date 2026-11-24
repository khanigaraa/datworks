import type { Photo } from '../content';
import { h } from './dom';

export interface PhotoOptions {
  /** Contact-sheet label, e.g. `FRAME 07/12 · GRADS`. */
  frame?: { n: number; total: number };
  /** Crop to a fixed ratio (catalog grids) instead of the photo's own aspect ratio. */
  crop?: string;
  /** `sizes` hint for responsive images, when the layout knows better than a grid cell. */
  sizes?: string;
  /** Above the fold: load right away, at high priority (it is likely the largest paint). */
  priority?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const frameLabel = (n: number, total: number) => `Frame ${pad(n)}/${pad(total)}`;

export interface FrameOptions {
  /** Aspect ratio to crop to (e.g. `4/5`); defaults to the photo's own ratio. */
  ratio?: string;
  /** Purely visual (e.g. a cover inside a link that already names the series). */
  decorative?: boolean;
  /** `sizes` hint for the browser; defaults to a grid cell. */
  sizes?: string;
  /** Load right away instead of lazily (lightbox, above-the-fold heroes). */
  eager?: boolean;
  /** Also ask for it before other images (likely the largest paint on the page). */
  priority?: boolean;
}

/** URL of one processed rendition, e.g. `/photos/dara-grad-04-1280.avif`. */
export const photoSrc = (id: string, width: number, format: 'avif' | 'webp') => `/photos/${id}-${width}.${format}`;

/** `srcset` for one format of a processed photo. */
export const photoSrcset = (photo: Photo, format: 'avif' | 'webp') =>
  (photo.image?.widths ?? []).map((w) => `${photoSrc(photo.id, w, format)} ${w}w`).join(', ');

/**
 * The intro photo (preloader). Shared with the build, which preloads exactly these
 * sources from index.html so the browser fetches the photo before any JavaScript runs.
 */
export const INTRO_SIZES = '(min-width: 768px) 900px, 92vw';

/** Series cover: full width. */
export const COVER_SIZES = '100vw';

/** Rendered width of a photo in the Work grid (also used to preload the first one). */
export const GRID_SIZES = '(min-width: 900px) 34vw, 100vw';

/**
 * The picture itself, at its real aspect ratio so nothing shifts while it loads.
 * Processed photos render as <picture> (AVIF, then WebP) over their tiny blurred preview,
 * fading in once decoded. Photos not processed yet render as a toned placeholder.
 */
export function photoFrame(photo: Photo, opts: FrameOptions = {}): HTMLElement {
  const ratio = opts.ratio ?? `${photo.width}/${photo.height}`;
  const image = photo.image;
  if (!image) {
    return h('div', {
      class: 'photo-frame',
      role: opts.decorative ? undefined : 'img',
      'aria-label': opts.decorative ? undefined : photo.alt,
      'aria-hidden': opts.decorative ? 'true' : undefined,
      style: `aspect-ratio:${ratio};--tone:${photo.tone ?? 0}`,
    });
  }

  const sizes = opts.sizes ?? GRID_SIZES;
  const srcset = (format: 'avif' | 'webp') => photoSrcset(photo, format);
  const fallback = image.widths[Math.min(1, image.widths.length - 1)];
  const img = h('img', {
    src: photoSrc(photo.id, fallback, 'webp'),
    srcset: srcset('webp'),
    sizes,
    alt: opts.decorative ? '' : photo.alt,
    width: photo.width,
    height: photo.height,
    loading: opts.eager || opts.priority ? 'eager' : 'lazy',
    fetchpriority: opts.priority ? 'high' : undefined,
    decoding: 'async',
  });
  const frame = h(
    'div',
    {
      // Priority photos are likely the largest paint: they show as soon as they decode, no fade.
      class: opts.priority ? 'photo-frame has-image is-priority' : 'photo-frame has-image',
      style: `aspect-ratio:${ratio};background-image:url("${image.blur}")`,
    },
    h('picture', {}, h('source', { type: 'image/avif', srcset: srcset('avif'), sizes }), img),
  );
  const loaded = () => frame.classList.add('is-loaded');
  if (img.complete && img.naturalWidth) loaded();
  else img.addEventListener('load', loaded, { once: true });
  return frame;
}

/**
 * A photo in a grid or series: the frame wrapped in a button that opens the lightbox
 * (the lightbox picks it up by `data-photo`), plus thin crop marks and a frame label.
 */
export function photoFigure(photo: Photo, opts: PhotoOptions = {}): HTMLElement {
  const open = h(
    'button',
    { type: 'button', class: 'photo-open', 'data-photo': photo.id, 'aria-label': `Open photo: ${photo.alt}` },
    photoFrame(photo, { ratio: opts.crop, sizes: opts.sizes, priority: opts.priority }),
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
    // Above-the-fold priority photos skip the scroll reveal so they paint as early as possible.
    { class: 'photo', 'data-reveal': !opts.priority, 'data-roll': photo.roll, 'data-photo': photo.id },
    open,
    caption,
  );
}
