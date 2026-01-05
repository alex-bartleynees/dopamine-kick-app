import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig({
  plugins: [
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    // VitePWA only generates manifest.webmanifest
    // Service worker is generated post-build via scripts/generate-sw.ts
    VitePWA({
      registerType: 'prompt',
      injectRegister: false, // Manual registration
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'robots.txt'],
      manifest: {
        name: 'Dopamine Kick',
        short_name: 'Dopamine Kick',
        description: 'Track your habits and build momentum',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      // Disable built-in SW generation - we use custom post-build script
      selfDestroying: true,
      workbox: {
        globPatterns: [],
        globDirectory: '.output/public',
      },
      outDir: '.output/public',
      devOptions: {
        enabled: false,
        type: 'module',
        suppressWarnings: true,
      },
    }),
  ],
})

export default config
