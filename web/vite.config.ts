import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // `npm run dev` serves the UI; `/api` goes to `npm run dev:api`
    // (wrangler pages dev, which runs functions/ with .dev.vars secrets).
    proxy: {
      '/api': 'http://127.0.0.1:8788',
    },
  },
});
