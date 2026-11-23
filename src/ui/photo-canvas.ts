import type { Photo } from '../content';

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
