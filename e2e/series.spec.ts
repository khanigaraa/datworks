import { expect, test } from '@playwright/test';

const ORDER = ['west-java-aquatics', 'love-story', 'dara-grad', 'silat-bumi-padjadjaran', 'ace-gathering-2025', 'still-life'];

test('opens Dara Grad directly as an editorial series', async ({ page }) => {
  await page.goto('/series/dara-grad');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dara Grad');
  await expect(page.locator('article.series')).toHaveAttribute('data-layout', 'editorial');
  await expect(page.locator('.series-meta')).toContainText('D.');
  await expect(page.locator('.ed-row').first()).toBeAttached();
  await expect(page.locator('.series .photo')).toHaveCount(16);
  await expect(page.locator('.frame-label').first()).toContainText('Frame 01/16');
  await expect(page).toHaveTitle('Dara Grad · datworks');
});

test('Next series walks through every series and wraps around', async ({ page }) => {
  await page.goto('/series/dara-grad');
  const start = ORDER.indexOf('dara-grad');
  for (let step = 1; step <= ORDER.length; step++) {
    const slug = ORDER[(start + step) % ORDER.length];
    await page.getByRole('link', { name: /^Next series:/ }).click();
    await expect(page).toHaveURL(new RegExp(`/series/${slug}$`));
    await expect(page.locator('article.series')).toHaveAttribute('data-series', slug);
  }
  await page.goBack();
  await expect(page.locator('article.series')).toHaveAttribute('data-series', 'love-story');
});

test('Still Life is a catalog grouped by product', async ({ page }) => {
  await page.goto('/series/still-life');
  await expect(page.locator('article.series')).toHaveAttribute('data-layout', 'catalog');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Dua Dimsum', 'My Cookies', 'ITB Gitar Nusantara']);
});

test('the love story stays anonymised', async ({ page }) => {
  await page.goto('/series/love-story');
  await expect(page.locator('.series-meta')).toContainText('A & D');
  const text = (await page.locator('body').innerText()).toLowerCase();
  expect(text).not.toContain('avyra');
  expect(text).not.toContain('dandi');
});

test('an unknown series slug shows the 404', async ({ page }) => {
  await page.goto('/series/does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("This frame hasn't been developed yet.");
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const slug of ['dara-grad', 'still-life', 'west-java-aquatics']) {
    test(`no horizontal overflow on /series/${slug}`, async ({ page }) => {
      await page.goto(`/series/${slug}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
