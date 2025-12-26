import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      manifest: {
        name: 'Drink Exchange Big Screen',
        short_name: 'DrinkX',
        description: 'Live pricing and event dashboard for the Drink Exchange.',
        start_url: '/',
        display: 'standalone',
        background_color: '#040510',
        theme_color: '#29c07f',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*']
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
