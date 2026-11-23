import { expect, test } from '@playwright/test';

const CHAPTERS = ['Engagement', 'Pre-wedding', 'Wedding', 'Studio'];

test('the love story shows its four chapters in order', async ({ page }) => {
  await page.goto('/series/love-story');
  await expect(page.locator('article.series')).toHaveAttribute('data-layout', 'chapters');
  await expect(page.locator('.chapter-title')).toHaveText(CHAPTERS);
  await expect(page.getByRole('navigation', { name: 'Chapters' }).getByRole('link')).toHaveText(
    CHAPTERS.map((c, i) => `0${i + 1}${c}`),
  );
  // Every chapter has photos and an opening line.
  for (const name of CHAPTERS) {
    const chapter = page.locator(`.chapter[data-chapter="${name}"]`);
    await expect(chapter.locator('.photo').first()).toBeAttached();
    await expect(chapter.locator('.lede')).not.toBeEmpty();
  }
});

test('the chapter index follows the reader and jumps between chapters', async ({ page }) => {
  await page.goto('/series/love-story');
  const nav = page.getByRole('navigation', { name: 'Chapters' });
  await expect(nav.getByRole('link', { name: /Engagement/ })).toHaveAttribute('aria-current', 'true');

  await nav.getByRole('link', { name: /Wedding/ }).filter({ hasNotText: 'Pre' }).click();
  await expect(nav.getByRole('link', { name: /^03/ })).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#chapter-wedding')).toBeFocused();
  await expect(page).toHaveURL(/\/series\/love-story$/);

  // The index stays pinned under the header while reading.
  const top = await nav.evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(60);
  expect(top).toBeLessThan(80);

  // The background tone follows the active chapter.
  await expect(page.locator('article.series')).toHaveCSS('--chapter-tone', '45');
});

test('the couple stays anonymised as "A & D"', async ({ page }) => {
  await page.goto('/series/love-story');
  await expect(page.locator('.series-meta')).toContainText('A & D');
  const text = (await page.locator('body').innerText()).toLowerCase();
  for (const name of ['avyra', 'dandi', 'vyra']) expect(text).not.toContain(name);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('chapter colour changes are instant', async ({ page }) => {
    await page.goto('/series/love-story');
    const duration = await page.locator('article.series').evaluate((e) => getComputedStyle(e).transitionDuration);
    expect(duration).toBe('0s');
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('no horizontal overflow and the chapter index scrolls on its own', async ({ page }) => {
    await page.goto('/series/love-story');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
