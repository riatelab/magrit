/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import solidPlugin from 'vite-plugin-solid';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';
import svgLoader from 'vite-svg-loader';
// import devtools from 'solid-devtools/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import electron from 'vite-plugin-electron/simple';

const isDevElectron = process.env.MODE === 'electrondev';
const isBuildElectron = process.env.MODE === 'electronbuild';
const isElectron = isDevElectron || isBuildElectron;

const jsToBottom = () => ({
  name: 'no-attribute',
  transformIndexHtml(html) {
    const scriptTag = html.match(/<script[^>]*>(.*?)<\/script[^>]*>/)[0];
    // eslint-disable-next-line no-param-reassign
    html = html.replace(scriptTag, '');
    // eslint-disable-next-line no-param-reassign
    html = html.replace('<!-- # INSERT SCRIPT HERE -->', scriptTag);
    return html;
  },
});

export default defineConfig({
  base: './',
  publicDir: 'src/public',
  plugins: [
    cssInjectedByJsPlugin({
      topExecutionPriority: true,
      id: 'stylesheet',
      preRenderCSSCode: (cssCode) => cssCode.replaceAll('./font-gis', './assets/font-gis'),
    }),
    wasm(),
    // We use top-level await, which was added in ES2022
    // so if we target anything lower than ES2022, we need to
    // use topLevelAwait plugin.
    // (See in the build section below - we currently target ES2020,
    //  and before releasing the app we should decide on the target
    //  and remove the topLevelAwait plugin if it's not needed.).
    // As of 2024-02-07, top-level await is supported in all
    // major desktop browsers (https://caniuse.com/mdn-javascript_operators_await_top_level),
    // since mid-2021 (Chromium 89+, Safari 15+, Firefox 89+, Edge 89+, Opera 75+),
    // which represents more than 94% of the global market share.
    // However, if we are building for electron, no need to use topLevelAwait.
    isElectron ? {} : topLevelAwait(),
    // devtools(),
    solidPlugin({ ssr: false }),
    svgLoader(),
    // Don't run eslint when building for electron
    isBuildElectron ? {} : eslint(),
    isElectron ? electron({
      main: {
        // Shortcut of `build.lib.entry`
        entry: 'electron/main.ts',
      },
      // preload: {
      //   // Shortcut of `build.rollupOptions.input`
      //   input: 'electron/preload.ts',
      // },
      // Optional: Use Node.js API in the Renderer process
      renderer: {},
    }) : {},
    jsToBottom(),
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
    // deps: { registerNodeLoader: true },
    // if you have few tests, try commenting one
    // or both out to improve performance:
    threads: false,
    isolate: false,
  },
  build: {
    outDir: isBuildElectron ? 'dist' : 'dist/app',
    target: isBuildElectron ? 'es2022' : 'es2020',
    minify: false,
    // rollupOptions: {
    //   output: {
    //     manualChunks: {
    //       gpujs: ['gpu.js'],
    //     },
    //   },
    // },
    cssMinify: true,
  },
  esbuild: {
    // keepNames: true,
    minifyIdentifiers: false,
    treeShaking: true,
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
});
