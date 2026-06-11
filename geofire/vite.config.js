import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Served from https://itaymining.github.io/locationGenerator/ on GitHub Pages.
  // Override at build time with VITE_BASE=/ for root deploys (Vercel/Netlify/custom domain).
  base: process.env.VITE_BASE || '/locationGenerator/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
