import { expect, test, type Page } from '@playwright/test';

const noWebGL = (page: Page) =>
  page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });

/** Hover the centre of the n-th photo in a hover-fx container, once its image has loaded. */
async function hoverPhoto(page: Page, n: number) {
  const frame = page.locator('[data-hover-fx] .photo-frame').nth(n);
  await frame.scrollIntoViewIfNeeded();
  await expect(frame).toHaveClass(/is-loaded/);
  await frame.hover();
  return frame;
}

test.describe('desktop with WebGL', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('hovering photos uses one shared canvas, created on demand', async ({ page }) => {
    await page.goto('/work');
    const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'));
    test.skip(!webgl, 'No WebGL in this browser');
    await expect(page.locator('.preloader')).toHaveCount(0);
    await expect(page.locator('canvas.hover-canvas')).toHaveCount(0); // nothing until the first hover

    const first = await hoverPhoto(page, 0);
    await expect(page.locator('canvas.hover-canvas')).toHaveCount(1);
    await expect(first).toHaveClass(/is-hover-gl/);

    const second = await hoverPhoto(page, 1);
    await expect(second).toHaveClass(/is-hover-gl/);
    await expect(page.locator('canvas.hover-canvas')).toHaveCount(1); // reused, not one per photo

    // Moving away fades the effect out.
    await page.mouse.move(5, 790);
    await expect(page.locator('.is-hover-gl')).toHaveCount(0);
  });
});

test.describe('without WebGL', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const path of ['/', '/work', '/series/dara-grad', '/series/west-java-aquatics']) {
    test(`photos still load as plain images on ${path}`, async ({ page }) => {
      await noWebGL(page);
      await page.goto(path);
      const first = page.locator('main .photo-frame.has-image').first();
      await first.scrollIntoViewIfNeeded();
      await expect(first).toHaveClass(/is-loaded/);
      expect(await first.locator('img').evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
      await expect(page.locator('canvas.hover-canvas, canvas.ripple-canvas')).toHaveCount(0);
    });
  }

  test('hover falls back to the CSS glow', async ({ page }) => {
    await noWebGL(page);
    await page.goto('/work');
    await expect(page.locator('.preloader')).toHaveCount(0);
    await hoverPhoto(page, 0);
    const glow = page.locator('[data-hover-fx] .photo-open').first();
    await expect
      .poll(() => glow.evaluate((el) => getComputedStyle(el, '::after').opacity))
      .toBe('1');
    await expect(page.locator('canvas.hover-canvas')).toHaveCount(0);
  });
});

test.describe('touch phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  test('never creates a WebGL hover canvas', async ({ page }) => {
    await page.goto('/work');
    await page.locator('[data-hover-fx] .photo-open').first().tap();
    await page.keyboard.press('Escape');
    await expect(page.locator('canvas.hover-canvas')).toHaveCount(0);
  });
});
