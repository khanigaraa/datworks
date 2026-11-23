/** Max skew in degrees, reached at about 2500 px/s of scrolling. */
export const MAX_SKEW = 8;

/**
 * Maps scroll velocity (px/s, positive = scrolling down) to a skew angle: photos lean
 * against the direction of travel, like a slow shutter dragging behind a fast athlete.
 */
export function velocityToSkew(velocity: number): number {
  const skew = (-velocity / 2500) * MAX_SKEW;
  return Math.max(-MAX_SKEW, Math.min(MAX_SKEW, skew)) || 0;
}

/** Blur in px for a given skew; skew is the "speed", blur follows it. */
export const skewToBlur = (skew: number) => Math.abs(skew) * 0.6;
