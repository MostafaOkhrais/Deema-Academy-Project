import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://deema.academy',
  output: 'static',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never' },
});
