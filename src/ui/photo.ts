import type { Photo } from '../content';
import { h } from './dom';

/**
 * Renders one photo. Until the image pipeline (ticket 02) exists, this is a toned
 * placeholder with the real aspect ratio and alt text, so layouts don't shift later.
 */
export function photoFigure(photo: Photo): HTMLElement {
  const frame = h('div', {
    class: 'photo-frame',
    role: 'img',
    'aria-label': photo.alt,
    style: `aspect-ratio:${photo.width}/${photo.height};--tone:${photo.tone ?? 0}`,
  });
  return h('figure', { class: 'photo', 'data-roll': photo.roll, 'data-photo': photo.id }, frame);
}
