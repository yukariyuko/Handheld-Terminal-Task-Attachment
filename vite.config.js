// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock';

export default defineConfig({
  plugins: [
    vue(),
    viteMockServe({
      mockPath: 'mock',
      localEnabled: true,
      supportTs: false,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5173', // 开发接口转发地址
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
  }
});
