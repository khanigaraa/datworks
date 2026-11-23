import { expect, test, type Page } from '@playwright/test';

const rollsShown = (page: Page) =>
  page.locator('.grid .photo').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('data-roll')))]);

test('opens a roll filter directly from the URL', async ({ page }) => {
  await page.goto('/work?roll=grads');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grads');
  await expect(page.getByRole('link', { name: 'Grads' })).toHaveAttribute('aria-current', 'true');
  expect(await rollsShown(page)).toEqual(['grads']);
});

test('changes filter without reload and restores it with back/forward', async ({ page }) => {
  await page.goto('/work?roll=grads');
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));

  await page.getByRole('link', { name: 'Event' }).click();
  await expect(page).toHaveURL(/\/work\?roll=event$/);
  expect(await rollsShown(page)).toEqual(['event']);
  // Same document: no full page reload happened.
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);

  await page.getByRole('link', { name: 'All' }).click();
  await expect(page).toHaveURL(/\/work$/);
  expect((await rollsShown(page)).length).toBe(5);

  await page.goBack();
  await expect(page).toHaveURL(/roll=event/);
  expect(await rollsShown(page)).toEqual(['event']);

  await page.goBack();
  expect(await rollsShown(page)).toEqual(['grads']);

  await page.goForward();
  expect(await rollsShown(page)).toEqual(['event']);
});

test('ignores an unknown roll and shows everything', async ({ page }) => {
  await page.goto('/work?roll=wedding');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Work');
  expect((await rollsShown(page)).length).toBe(5);
});

test('unknown routes show the darkroom 404', async ({ page }) => {
  await page.goto('/this/does/not/exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("This frame hasn't been developed yet.");
  await page.getByRole('link', { name: /back to the archive/i }).click();
  await expect(page).toHaveURL(/\/work$/);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const path of ['/', '/work', '/work?roll=lover', '/nope']) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
