import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-512.png', 'icon.svg'],
      manifest: {
        name: '活動記録',
        short_name: '活動記録',
        description: '活動記録アプリ',
        theme_color: '#2E5C55',
        background_color: '#FDFBF7',
        display: 'standalone',
        start_url: './index.html',
        icons: [
          {
            src: 'icon-512.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/schedule_manager/',
})
