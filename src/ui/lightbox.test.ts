import { describe, expect, it } from 'vitest';
import { swipeStep, wrapIndex } from './lightbox';

describe('wrapIndex', () => {
  it('wraps past both ends', () => {
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(2, 5)).toBe(2);
  });
});

describe('swipeStep', () => {
  it('swiping left goes to the next photo, right to the previous', () => {
    expect(swipeStep(-120, 10)).toBe(1);
    expect(swipeStep(120, -10)).toBe(-1);
  });

  it('ignores taps and vertical scrolls', () => {
    expect(swipeStep(20, 0)).toBe(0);
    expect(swipeStep(-80, 200)).toBe(0);
  });
});
