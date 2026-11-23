import { expect, test } from '@playwright/test';

const h1 = (page: import('@playwright/test').Page) => page.getByRole('heading', { level: 1 });

test('navigates through the index menu with a page transition', async ({ page }) => {
  await page.goto('/work');
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));

  const toggle = page.getByRole('button', { name: 'Index' });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('dialog', { name: 'Site index' }).getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(h1(page)).toHaveText('The King of All Trades');
  await expect(page).toHaveTitle('About · datworks');
  await expect(page.getByRole('button', { name: 'Index' })).toHaveAttribute('aria-expanded', 'false');

  // The curtain lifts and the heading fades in once the transition has finished.
  await expect(page.locator('#curtain')).toHaveCSS('transform', 'matrix(1, 0, 0, 0, 0, 0)');
  await expect(h1(page)).toHaveCSS('opacity', '1');
  // Still the same document: no full reload.
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);

  await page.goBack();
  await expect(page).toHaveURL(/\/work$/);
  await expect(h1(page)).toHaveText('Work');
  await page.goForward();
  await expect(h1(page)).toHaveText('The King of All Trades');
});

test('menu lists all six series and closes with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Index' }).click();
  const menu = page.getByRole('dialog', { name: 'Site index' });
  await expect(menu.getByRole('navigation', { name: 'Series' }).getByRole('link')).toHaveCount(6);

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.getByRole('button', { name: 'Index' })).toBeFocused();
});

test('opens a series from the menu; unknown series show the 404', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Index' }).click();
  await page.getByRole('link', { name: /Dara Grad/ }).click();
  await expect(page).toHaveURL(/\/series\/dara-grad$/);
  await expect(h1(page)).toHaveText('Dara Grad');

  await page.goto('/series/not-a-series');
  await expect(h1(page)).toHaveText("This frame hasn't been developed yet.");
});

test('opens /about directly with services, contacts and the rebuild note', async ({ page }) => {
  await page.goto('/about');
  await expect(h1(page)).toHaveText('The King of All Trades');
  await expect(page.getByRole('link', { name: /Instagram/ }).first()).toHaveAttribute('href', /instagram\.com/);
  await expect(page.getByRole('link', { name: 'WhatsApp' }).first()).toHaveAttribute('href', /wa\.me/);
  await expect(page.getByText('Originally built in 2025 for datworks · rebuilt in 2026')).toBeVisible();
  await expect(page.locator('.services li')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'About' }).first()).toHaveAttribute('aria-current', 'page');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows content immediately, without curtain or reveals', async ({ page }) => {
    await page.goto('/work');
    // Without reveal animations nothing is ever hidden, even below the fold.
    const hidden = await page
      .locator('[data-reveal]')
      .evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
    expect(hidden).toBe(0);

    await page.getByRole('link', { name: 'About' }).first().click();
    await expect(h1(page)).toHaveText('The King of All Trades');
    expect(await h1(page).evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    expect(await page.locator('#curtain').evaluate((e) => getComputedStyle(e).transform)).toBe(
      'matrix(1, 0, 0, 0, 0, 0)',
    );
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const path of ['/about', '/series/love-story']) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('index menu works on a phone', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.header-nav a')).toHaveCount(2);
    await expect(page.locator('.header-nav a').first()).toBeHidden();
    await page.getByRole('button', { name: 'Index' }).click();
    await page.getByRole('dialog', { name: 'Site index' }).getByRole('link', { name: 'Work', exact: true }).click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(h1(page)).toHaveText('Work');
  });
});
