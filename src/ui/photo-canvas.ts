import { Texture, type OGLRenderingContext } from 'ogl';
import type { Photo } from '../content';
import { photoSrc } from './photo';

/** Paints the placeholder look of a photo onto a canvas (swapped for the real image in ticket 02). */
export function photoCanvas(photo: Photo, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round((width * photo.height) / photo.width);
  const g = canvas.getContext('2d')!;
  const tone = photo.tone ?? 0;
  const lin = g.createLinearGradient(0, 0, canvas.width, canvas.height);
  lin.addColorStop(0, `hsl(${tone} 22% 18%)`);
  lin.addColorStop(1, `hsl(${tone} 14% 6%)`);
  g.fillStyle = lin;
  g.fillRect(0, 0, canvas.width, canvas.height);
  const rad = g.createRadialGradient(width * 0.3, canvas.height * 0.25, 0, width * 0.3, canvas.height * 0.25, width);
  rad.addColorStop(0, `hsl(${tone} 35% 32% / 0.95)`);
  rad.addColorStop(0.6, `hsl(${tone} 30% 20% / 0)`);
  g.fillStyle = rad;
  g.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * A WebGL texture for a photo: the placeholder canvas right away, swapped for the real
 * image (WebP rendition closest to `width`) once it has loaded. `ready` resolves either way.
 */
export function photoTexture(gl: OGLRenderingContext, photo: Photo, width = 1280): { texture: Texture; ready: Promise<void> } {
  const texture = new Texture(gl, { image: photoCanvas(photo, 512), generateMipmaps: false });
  if (!photo.image) return { texture, ready: Promise.resolve() };
  const best = photo.image.widths.reduce((a, b) => (Math.abs(b - width) < Math.abs(a - width) ? b : a));
  const img = new Image();
  img.decoding = 'async';
  img.src = photoSrc(photo.id, best, 'webp');
  const ready = img
    .decode()
    .then(() => {
      texture.image = img; // OGL re-uploads when the image reference changes
    })
    .catch(() => undefined);
  return { texture, ready };
}
