import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/earn-api': {
        target: 'https://earn.li.fi',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/earn-api/, ''),
      },
    },
  },
})
