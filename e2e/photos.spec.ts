import { expect, test } from '@playwright/test';

test('the Grads roll uses real photos: AVIF/WebP sources, lazy, with a blur preview', async ({ page }) => {
  await page.goto('/work?roll=grads');
  const first = page.locator('.grid .photo').first();
  const img = first.locator('img');

  await expect(first.locator('source[type="image/avif"]')).toHaveAttribute('srcset', /\/photos\/dara-grad-04-640\.avif 640w/);
  await expect(img).toHaveAttribute('srcset', /dara-grad-04-1920\.webp 1920w/);
  // The first row is likely the largest paint: eager and high priority. The rest load lazily.
  await expect(img).toHaveAttribute('loading', 'eager');
  await expect(img).toHaveAttribute('fetchpriority', 'high');
  await expect(page.locator('.grid .photo img').nth(3)).toHaveAttribute('loading', 'lazy');
  await expect(img).toHaveAccessibleName(/red railing/);
  await expect(first.locator('.photo-frame')).toHaveCSS('background-image', /data:image\/webp/);

  // The image actually loads and fades in.
  await expect(first.locator('.photo-frame')).toHaveClass(/is-loaded/);
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  // Only Dara's real photos are in the Grads roll now: no placeholders left there.
  await expect(page.locator('.grid .photo-frame:not(.has-image)')).toHaveCount(0);
});

test('frames keep their size before the image loads (no layout shift)', async ({ page }) => {
  // Block photo downloads so only the reserved frames are on the page.
  await page.route('**/photos/**', (route) => route.abort());
  await page.goto('/work?roll=grads');
  const frames = page.locator('.grid .photo-frame');
  // Each frame already has the photo's real aspect ratio, taken from the pipeline metadata.
  const sizes = await frames.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      const img = el.querySelector('img')!;
      const expected = Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
      return r.height > 0 && Math.abs(r.width / r.height - expected) < 0.02;
    }),
  );
  expect(sizes.length).toBe(15);
  expect(sizes.every(Boolean)).toBe(true);
});

test('the lightbox loads the large rendition eagerly', async ({ page }) => {
  await page.goto('/series/dara-grad');
  await page.locator('.photo-open').first().click();
  const img = page.locator('.lb-stage img');
  await expect(img).toHaveAttribute('loading', 'eager');
  await expect(img).toHaveAttribute('sizes', '100vw');
  await expect(page.locator('.lb-stage .photo-frame')).toHaveClass(/is-loaded/);
});
