import { expect, test } from '@playwright/test';

const h1 = (page: import('@playwright/test').Page) => page.getByRole('heading', { level: 1 });

test('navigates through the index menu with a page transition', async ({ page }) => {
  await page.goto('/work');
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));

  const toggle = page.getByRole('button', { name: 'Index' });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toHaveAttribute('aria-expanded', 'true');

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
  await page.getByRole('dialog', { name: 'Site index' }).getByRole('link', { name: /Dara Grad/ }).click();
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

  for (const path of ['/about']) {
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

// Regression: locking scroll with overflow on <body> made <body> the scroll container, so the
// sticky header jumped back to the top of the document and the Close button disappeared.
for (const [label, opts] of [
  ['desktop', { viewport: { width: 1280, height: 800 } }],
  ['phone', { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true }],
] as const) {
  test.describe(`header stays put after scrolling (${label})`, () => {
    test.use(opts);

    test('opening the index menu deep in a page keeps the header and Close button', async ({ page }) => {
      await page.goto('/series/love-story');
      await expect(page.locator('.preloader')).toHaveCount(0);
      await page.evaluate(() => window.scrollTo(0, 2500));
      await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBeGreaterThan(2000);
      const scrolled = await page.evaluate(() => Math.round(scrollY));

      await page.getByRole('button', { name: 'Index' }).click();
      const header = page.locator('.site-header');
      await expect.poll(() => header.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(0);
      const close = page.getByRole('button', { name: 'Close', exact: true });
      await expect(close).toBeInViewport();

      await close.click();
      await expect(page.getByRole('button', { name: 'Index' })).toHaveAttribute('aria-expanded', 'false');
      // Closing the menu returns to the same spot on the page.
      expect(Math.abs((await page.evaluate(() => Math.round(scrollY))) - scrolled)).toBeLessThan(80);
    });

    test('the lightbox does not move the header either', async ({ page }) => {
      await page.goto('/work');
      await expect(page.locator('.preloader')).toHaveCount(0);
      const target = page.locator('.photo-open').nth(6);
      await target.scrollIntoViewIfNeeded();
      await target.click();
      await page.keyboard.press('Escape');
      await expect
        .poll(() => page.locator('.site-header').evaluate((el) => Math.round(el.getBoundingClientRect().top)))
        .toBe(0);
    });
  });
}

test.describe('index menu on a short phone screen', () => {
  test.use({ viewport: { width: 375, height: 640 }, hasTouch: true, isMobile: true });

  // Regression: the menu scrolled as a whole, so its links slid under the transparent header
  // ("datworks." printed over "Home") and Chromium leaked page photos through the clip-path.
  test('menu content scrolls below the header, never under it', async ({ page }) => {
    await page.goto('/work');
    await expect(page.locator('.preloader')).toHaveCount(0);
    await page.getByRole('button', { name: 'Index' }).click();
    const inner = page.locator('.menu-inner');
    await expect(page.getByRole('dialog', { name: 'Site index' })).toBeVisible();

    const scrollable = await inner.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(scrollable).toBeGreaterThan(0); // the menu is taller than this screen
    await inner.evaluate((el) => (el.scrollTop = el.scrollHeight));

    const headerBottom = await page.locator('.site-header').evaluate((el) => el.getBoundingClientRect().bottom);
    const scrollerTop = await inner.evaluate((el) => el.getBoundingClientRect().top);
    expect(scrollerTop).toBeGreaterThanOrEqual(headerBottom - 1);
    // The menu layer itself doesn't scroll, so nothing behind it can show through.
    expect(await page.locator('#site-menu').evaluate((el) => el.scrollTop)).toBe(0);
    // The last links are reachable and the Close button is still there.
    await expect(page.getByRole('dialog', { name: 'Site index' }).getByRole('link', { name: 'WhatsApp' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeInViewport();
  });
});
