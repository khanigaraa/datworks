import { defineConfig, type Plugin } from 'vitest/config';
import { catalog } from './src/content';

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

export default defineConfig({
  // Absolute base: the site uses History API routes like /series/<slug>.
  base: '/',
  plugins: [validateContent()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
