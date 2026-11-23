import { expect, test } from '@playwright/test';

test('gallery photos carry contact-sheet frame labels', async ({ page }) => {
  await page.goto('/work?roll=grads');
  const labels = page.locator('.grid .frame-label');
  await expect(labels.first()).toContainText('Frame 01/16');
  await expect(labels.first()).toContainText('grads');
  await expect(labels.last()).toContainText('Frame 16/16');
});

test('opens, steps with the arrow keys, closes with Escape and returns focus', async ({ page }) => {
  await page.goto('/work?roll=grads');
  const second = page.locator('.photo-open').nth(1);
  const secondId = await second.getAttribute('data-photo');
  const thirdId = await page.locator('.photo-open').nth(2).getAttribute('data-photo');

  // Keyboard: focus the trigger and press Enter.
  await second.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Photo viewer' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('data-photo', secondId!);
  await expect(dialog.locator('.lb-frame')).toHaveText('Frame 02/16 · grads');
  await expect(dialog.getByRole('img')).toHaveAccessibleName(/bouquet of orange and white flowers/);

  await page.keyboard.press('ArrowRight');
  await expect(dialog).toHaveAttribute('data-photo', thirdId!);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.locator('.lb-frame')).toHaveText('Frame 01/16 · grads');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.locator('.lb-frame')).toHaveText('Frame 16/16 · grads');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(second).toBeFocused();
});

test('keeps focus inside and closes with the button or the backdrop', async ({ page }) => {
  await page.goto('/series/dara-grad');
  await page.locator('.photo-open').first().click();
  const dialog = page.getByRole('dialog', { name: 'Photo viewer' });
  await expect(dialog.locator('.lb-frame')).toHaveText('Frame 01/16 · grads');

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }

  await page.getByRole('button', { name: 'Next photo' }).click();
  await expect(dialog.locator('.lb-frame')).toHaveText('Frame 02/16 · grads');
  await page.getByRole('button', { name: 'Close photo viewer' }).click();
  await expect(dialog).toBeHidden();

  await page.locator('.photo-open').nth(3).click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 300); // the dark backdrop at the edge of the screen
  await expect(dialog).toBeHidden();
});

test('swipes between photos on a touch screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/work?roll=lover');
  await page.locator('.photo-open').first().click();
  const stage = page.locator('.lb-stage');
  const box = (await stage.boundingBox())!;
  const y = box.y + box.height / 2;

  const swipe = async (from: number, to: number) => {
    await stage.dispatchEvent('pointerdown', { clientX: from, clientY: y });
    await stage.dispatchEvent('pointerup', { clientX: to, clientY: y });
  };
  await swipe(300, 80);
  await expect(page.locator('.lb-frame')).toHaveText('Frame 02/14 · lover');
  await swipe(80, 300);
  await expect(page.locator('.lb-frame')).toHaveText('Frame 01/14 · lover');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the lightbox appears without a fade', async ({ page }) => {
    await page.goto('/work');
    await page.locator('.photo-open').first().click();
    const opacity = await page.locator('dialog.lightbox').evaluate((e) => getComputedStyle(e).opacity);
    expect(opacity).toBe('1');
  });
});
