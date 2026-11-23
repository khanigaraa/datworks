import { expect, test } from '@playwright/test';

const URL = '/series/west-java-aquatics';

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('pins the strip and scrolling down moves it sideways', async ({ page }) => {
    await page.goto(URL);
    const section = page.locator('.layout-horizontal');
    await expect(section).toHaveClass(/is-pinned/);
    await expect(page.locator('.h-track .photo')).toHaveCount(11);

    const x = () =>
      page.locator('.h-track').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    expect(await x()).toBe(0);
    await page.mouse.move(640, 400);
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 600);
    await expect.poll(x, { timeout: 5000 }).toBeLessThan(-300);

    // While pinned, the section stays right under the header.
    const top = await section.evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.round(top)).toBe(72);
  });

  test('draws the water ripple on a single shared WebGL canvas when available', async ({ page }) => {
    await page.goto(URL);
    const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'));
    test.skip(!webgl, 'No WebGL in this browser');
    await expect(page.locator('canvas.ripple-canvas')).toHaveCount(1);
    await expect(page.locator('.layout-horizontal')).toHaveClass(/ripple-active/);

    // Photos still open in the lightbox through the invisible DOM frames.
    await page.locator('.h-track .photo-open').first().click();
    await expect(page.locator('.lb-frame')).toHaveText(/^Frame 02\/12/);
    await page.keyboard.press('Escape');

    // Leaving the page removes the canvas again.
    await page.getByRole('link', { name: /^Next series:/ }).click();
    await expect(page).toHaveURL(/\/series\/love-story$/);
    await expect(page.locator('canvas.ripple-canvas')).toHaveCount(0);
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  test('swipes natively: no pin, no shader, no page overflow', async ({ page }) => {
    await page.goto(URL);
    const section = page.locator('.layout-horizontal');
    await expect(section).not.toHaveClass(/is-pinned/);
    await expect(page.locator('canvas.ripple-canvas')).toHaveCount(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    const track = page.locator('.h-track');
    const { scrollable, snap } = await track.evaluate((el) => ({
      scrollable: el.scrollWidth > el.clientWidth,
      snap: getComputedStyle(el).scrollSnapType,
    }));
    expect(scrollable).toBe(true);
    expect(snap).toContain('x');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });

  test('shows every frame in a plain vertical grid', async ({ page }) => {
    await page.goto(URL);
    const section = page.locator('.layout-horizontal');
    await expect(section).not.toHaveClass(/is-pinned/);
    await expect(page.locator('canvas.ripple-canvas')).toHaveCount(0);
    expect(await page.locator('.h-track').evaluate((el) => getComputedStyle(el).display)).toBe('grid');

    const offscreen = await page.locator('.h-track .photo-frame').evaluateAll(
      (els) => els.filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).length,
    );
    expect(offscreen).toBe(0);
  });
});
