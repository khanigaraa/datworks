import { expect, test, type Page } from '@playwright/test';

const SILAT = '/series/silat-bumi-padjadjaran';

const skew = (page: Page) =>
  page.locator('.layout-blur').evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--skew')));

test('Silat frames lean and blur while scrolling fast, then snap sharp', async ({ page }) => {
  await page.goto(SILAT);
  await expect(page.locator('article.series')).toHaveAttribute('data-layout', 'blur');
  await expect(page.locator('.layout-blur .photo')).toHaveCount(11);
  await expect(page.locator('.preloader')).toHaveCount(0);

  await page.mouse.move(640, 400);
  let peak = 0;
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 400);
    peak = Math.max(peak, Math.abs(await skew(page)));
  }
  expect(peak).toBeGreaterThan(0.5);
  await expect.poll(() => skew(page), { timeout: 4000 }).toBe(0);
});

test('ACE Gathering uses the editorial layout with a curated set', async ({ page }) => {
  await page.goto('/series/ace-gathering-2025');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ACE Gathering & Seminar');
  await expect(page.locator('article.series')).toHaveAttribute('data-layout', 'editorial');
  const frames = await page.locator('.series .photo').count();
  expect(frames).toBeGreaterThanOrEqual(10);
  expect(frames).toBeLessThanOrEqual(20);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Silat stays sharp and still', async ({ page }) => {
    await page.goto(SILAT);
    await page.mouse.move(640, 400);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 500);
    expect(await skew(page)).toBe(0);
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  test('no blur filter and no horizontal overflow', async ({ page }) => {
    await page.goto(SILAT);
    const filter = await page.locator('.layout-blur .photo-frame').first().evaluate((e) => getComputedStyle(e).filter);
    expect(filter).toBe('none');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
