import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'  // 代理转发，避免跨域
    }
  },
  build: {
    outDir: path.resolve(import.meta.dirname, '../server/dist/web'),
    emptyOutDir: true
  }
})
