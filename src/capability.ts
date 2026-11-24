import { reducedMotion } from './motion-pref';

/** WebGL effects are worth it only on a capable device: WebGL, enough cores and memory. */
export function webglCapable(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 4) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl');
  } catch {
    return false;
  }
}

/** A real mouse (hover + fine pointer): smooth scroll, hover effects and pinned sections. */
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** WebGL hover only where it can shine: a mouse, a capable GPU/CPU and motion allowed. */
export const canHoverFx = () => finePointer() && !reducedMotion() && webglCapable();
