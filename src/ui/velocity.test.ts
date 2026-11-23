import { describe, expect, it } from 'vitest';
import { MAX_SKEW, skewToBlur, velocityToSkew } from './velocity';

describe('velocityToSkew', () => {
  it('is zero when still', () => {
    expect(velocityToSkew(0)).toBe(0);
  });

  it('leans against the scroll direction, proportional to speed', () => {
    expect(velocityToSkew(1250)).toBeCloseTo(-MAX_SKEW / 2);
    expect(velocityToSkew(-1250)).toBeCloseTo(MAX_SKEW / 2);
  });

  it('is capped so fast flicks stay readable', () => {
    expect(velocityToSkew(99999)).toBe(-MAX_SKEW);
    expect(velocityToSkew(-99999)).toBe(MAX_SKEW);
  });
});

describe('skewToBlur', () => {
  it('grows with the skew in either direction', () => {
    expect(skewToBlur(-5)).toBe(skewToBlur(5));
    expect(skewToBlur(8)).toBeGreaterThan(skewToBlur(2));
  });
});
