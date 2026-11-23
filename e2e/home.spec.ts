import { expect, test } from '@playwright/test';

test('home shows the hero, showreel, five rolls and six series', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('datworks.');
  await expect(page.locator('.hero-tagline')).toHaveText('The King of All Trades');
  await expect(page.getByRole('region', { name: 'Showreel' }).locator('.photo')).toHaveCount(11);
  await expect(page.locator('.roll-link')).toHaveCount(5);
  await expect(page.locator('.series-card')).toHaveCount(6);
  await expect(page.locator('.preloader')).toHaveCount(0);
});

test('roll and series links lead to the right routes', async ({ page }) => {
  await page.goto('/');
  await page.locator('.roll-link', { hasText: 'Product' }).click();
  await expect(page).toHaveURL(/\/work\?roll=product$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Product');

  await page.goBack();
  await page.locator('.series-card', { hasText: 'Still Life' }).click();
  await expect(page).toHaveURL(/\/series\/still-life$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Still Life');
});

test('showreel photos open in the lightbox', async ({ page }) => {
  await page.goto('/');
  await page.locator('.reel .photo-open').first().click();
  await expect(page.locator('.lb-frame')).toHaveText(/^Frame 01\/11/);
});

test.describe('first visit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('plays the developing intro, which can be skipped', async ({ page }) => {
    // Freeze time so the intro can't finish on its own before we press Skip (slow CI machines).
    await page.clock.install({ time: new Date('2026-11-23T10:00:00') });
    await page.clock.pauseAt(new Date('2026-11-23T10:00:01'));
    await page.goto('/');
    await page.clock.runFor(500);
    const preloader = page.locator('.preloader');
    await expect(preloader).toBeVisible();
    await expect(preloader.locator('canvas')).toHaveCount(1);
    await expect(page.locator('.pre-status')).toContainText('Developing');

    await page.getByRole('button', { name: 'Skip intro' }).click();
    await page.clock.runFor(2000);
    await expect(preloader).toHaveCount(0, { timeout: 2000 });
    await page.clock.resume();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('opacity', '1');

    // Remembered: the next visit gets the short version.
    expect(await page.evaluate(() => localStorage.getItem('datworks:developed'))).toBe('1');
  });

  test('falls back to a CSS develop effect without WebGL', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type.startsWith('webgl')) return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    await page.goto('/');
    await expect(page.locator('.pre-print-css')).toBeVisible();
    await expect(page.locator('.preloader canvas')).toHaveCount(0);
    await expect(page.locator('.preloader')).toHaveCount(0, { timeout: 6000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('datworks.');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', storageState: { cookies: [], origins: [] } });

  test('skips the intro and shows the content straight away', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.preloader')).toHaveCount(0);
    const hidden = await page
      .locator('[data-reveal]')
      .evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
    expect(hidden).toBe(0);
  });
});
