/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import solidPlugin from 'vite-plugin-solid';

import wasm from 'vite-plugin-wasm';
// import devtools from 'solid-devtools/vite';
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    wasm(),
    // devtools(),
    solidPlugin({ ssr: false }),
    // VitePWA({
    //   injectRegister: 'script',
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: true,
    //   },
    //   workbox: {
    //     globPatterns: ['**/*'],
    //   },
    //   includeAssets: ['**/*'],
    //   manifest: {
    //     name: 'Magrit',
    //     description: 'A thematic cartography tool',
    //     short_name: 'Magrit',
    //     theme_color: '#ffffff',
    //     scope: '/',
    //     start_url: '/app',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable',
    //       },
    //     ],
    //   },
    // }),
    eslint(),
  ],
  server: {
    port: 3000,
    headers: {
      'Cache-Control': 'no-cache; max-age=1',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    transformMode: { web: [/\.[jt]sx?$/] },
    setupFiles: ['node_modules/@testing-library/jest-dom/extend-expect.js'],
    // otherwise, solid would be loaded twice:
    deps: { registerNodeLoader: true },
    // if you have few tests, try commenting one
    // or both out to improve performance:
    threads: false,
    isolate: false,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
});
