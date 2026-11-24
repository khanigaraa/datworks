import { defineConfig, type Plugin } from 'vitest/config';
import { catalog } from './src/content';
import type { Photo } from './src/content';
import { COVER_SIZES, GRID_SIZES, INTRO_SIZES, photoSrc, photoSrcset } from './src/ui/photo';

/** Fails the build when the content module is invalid (duplicate ids, missing alt, curation limits…). */
function validateContent(): Plugin {
  return {
    name: 'datworks:validate-content',
    buildStart() {
      const errors = catalog.validate();
      if (errors.length) this.error(`Invalid content:\n- ${errors.join('\n- ')}`);
    },
  };
}

/**
 * Preloads the largest image of the landing route straight from index.html, so it downloads in
 * parallel with the JavaScript instead of after it (this is a client-rendered app, so otherwise
 * the browser only learns about it once the bundle has run). A tiny inline script picks the
 * entry for the current URL: the intro photo on /, the first frame of the grid on /work (per
 * roll), the cover on each /series page.
 */
function preloadLcpImage(): Plugin {
  type Hint = { as: 'image'; type: string; href: string; imageSrcset: string; imageSizes: string };
  const hint = (photo: Photo | undefined, format: 'avif' | 'webp', sizes: string): Hint | null =>
    photo?.image
      ? {
          as: 'image',
          type: `image/${format}`,
          href: photoSrc(photo.id, photo.image.widths[0], format),
          imageSrcset: photoSrcset(photo, format),
          imageSizes: sizes,
        }
      : null;

  return {
    name: 'datworks:preload-lcp-image',
    transformIndexHtml() {
      const routes: Record<string, Hint | null> = {
        // The intro is a plain <img> (WebP); grid and covers are <picture> (AVIF first).
        '/': hint(catalog.showreel()[0], 'webp', INTRO_SIZES),
        '/work': hint(catalog.listPhotos()[0], 'avif', GRID_SIZES),
      };
      for (const r of catalog.listRolls())
        routes[`/work?roll=${r.id}`] = hint(catalog.listPhotos({ roll: r.id })[0], 'avif', GRID_SIZES);
      for (const s of catalog.listSeries())
        routes[`/series/${s.slug}`] = hint(catalog.getPhoto(s.cover), 'avif', COVER_SIZES);

      const script =
        `(function(m){var p=location.pathname;if(p.length>1&&p.charAt(p.length-1)==='/')p=p.slice(0,-1);` +
        `var h=m[p==='/work'&&location.search?p+location.search:p];if(!h)return;` +
        `var l=document.createElement('link');l.rel='preload';l.fetchPriority='high';` +
        `Object.assign(l,h);document.head.appendChild(l)})(${JSON.stringify(routes)})`;
      return [{ tag: 'script', injectTo: 'head', children: script }];
    },
  };
}

export default defineConfig({
  // Absolute base: the site uses History API routes like /series/<slug>.
  base: '/',
  plugins: [validateContent(), preloadLcpImage()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
