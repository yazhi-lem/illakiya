import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const workspaceRoot = new URL('..', import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@data': `${workspaceRoot}data`,
    },
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
});
