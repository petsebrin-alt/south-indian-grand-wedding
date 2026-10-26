// @ts-check
import { defineConfig } from 'astro/config';
import { devApi } from './scripts/dev-api/integration.mjs';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'auto' },
  // Decorations repeat across pages (lamps, arches, drapes): serve them as cached files rather than
  // inlining each copy into the HTML as a data URI.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [devApi()],
});
