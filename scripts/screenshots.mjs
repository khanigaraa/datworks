// README media: screenshots + an animated GIF of the "developing" intro.
//
//   npm run build && npx vite preview --port 5182   (in another terminal)
//   npm run screenshots
//
// Uses the Edge already installed on Windows (Playwright channel "msedge"); writes to docs/.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:5182';
const OUT = new URL('../docs/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge' });
const seen = { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'datworks:developed', value: '1' }] }] };

async function page(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, storageState: seen, ...opts });
  return ctx.newPage();
}
const settle = (p, ms = 1500) => p.waitForTimeout(ms);
async function shot(p, name) {
  await p.screenshot({ path: join(OUT, `${name}.png`) });
  // Keep the repo light: re-encode PNG screenshots as quality-80 JPEGs.
  await sharp(join(OUT, `${name}.png`)).jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, `${name}.jpg`));
  rmSync(join(OUT, `${name}.png`));
  console.log('saved', `${name}.jpg`);
}

const desktop = { width: 1440, height: 900 };

// 1. Home hero and showreel
{
  const p = await page(desktop);
  await p.goto(`${BASE}/`);
  await p.locator('.preloader').waitFor({ state: 'detached' });
  await settle(p);
  await shot(p, 'home');
  await p.mouse.wheel(0, 900);
  await settle(p, 2000);
  await shot(p, 'showreel');
  await p.context().close();
}

// 2. Work grid, hovering a photo (WebGL darkroom hover)
{
  const p = await page(desktop);
  await p.goto(`${BASE}/work`);
  await settle(p, 2500);
  const frame = p.locator('[data-hover-fx] .photo-frame').nth(1);
  await frame.hover({ position: { x: 200, y: 160 } });
  await settle(p, 900);
  await shot(p, 'work');
  await p.context().close();
}

// 3. West Java Aquatics: pinned horizontal strip with the water ripple
{
  const p = await page(desktop);
  await p.goto(`${BASE}/series/west-java-aquatics`);
  await settle(p, 2000);
  await p.mouse.move(720, 450);
  for (let i = 0; i < 6; i++) await p.mouse.wheel(0, 500);
  await settle(p, 2500);
  await shot(p, 'aquatics');
  await p.context().close();
}

// 4. Love story chapters and the lightbox
{
  const p = await page(desktop);
  await p.goto(`${BASE}/series/love-story`);
  await settle(p, 2000);
  await p.locator('.chapter-nav a[data-chapter="Wedding"]').click();
  await settle(p, 2500);
  await shot(p, 'love-story');
  await p.locator('.chapter[data-chapter="Wedding"] .photo-open').first().click();
  await settle(p, 1500);
  await shot(p, 'lightbox');
  await p.context().close();
}

// 5. Phone
{
  const p = await page({ width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(`${BASE}/work?roll=lover`);
  await settle(p, 2500);
  await shot(p, 'mobile');
  await p.context().close();
}

// 6. The "developing" intro as a GIF, frame by frame with a fake clock
{
  const ctx = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date('2026-11-24T10:00:00') });
  await p.clock.pauseAt(new Date('2026-11-24T10:00:01'));
  await p.goto(`${BASE}/`);
  await p.locator('.pre-print canvas').waitFor();
  const frames = [];
  for (let i = 0; i < 16; i++) {
    await p.clock.runFor(160);
    await p.waitForTimeout(60);
    const png = await p.locator('.pre-inner').screenshot();
    frames.push(await sharp(png).resize({ width: 420 }).png().toBuffer());
  }
  const { width, height } = await sharp(frames[0]).metadata();
  const sized = await Promise.all(frames.map((f) => sharp(f).resize(width, height, { fit: 'cover' }).png().toBuffer()));
  await sharp(sized, { join: { animated: true } })
    .gif({ delay: [...Array(sized.length - 1).fill(140), 1600], loop: 0, effort: 10, colours: 96, dither: 0.6, interFrameMaxError: 6 })
    .toFile(join(OUT, 'developing.gif'));
  console.log('saved developing.gif');
  await ctx.close();
}

await browser.close();
