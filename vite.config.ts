import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/components/ui/**'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/components/ui/**', '**/*.d.ts'],
    },
    passWithNoTests: true,
  },
  base: '/reizouko-manager/',
});
