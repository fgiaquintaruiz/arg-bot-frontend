import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 10000,
    proxy: {
      '/api': 'http://localhost:10001'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/jest/**',
      '**/tests/playwright/**'
    ],
    include: ['**/tests/**/*.test.{js,jsx,ts,tsx}']
  }
})
