// vite.config.js
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { viteMockServe } from 'vite-plugin-mock';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [
    vue(),
    viteMockServe({
      mockPath: 'mock',
      localEnabled: true,
      supportTs: false,
    }),
  ],
  resolve: {
    alias: {
      'src': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.2.57', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/prod-api'),
      },

      '/webrtc-api': {
        target: 'http://192.168.2.57',
        changeOrigin: true,
      },

      '/easy-api': {
        target: 'http://192.168.2.57',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],

      include: ['src/view/**/*.{js,vue}'],

      exclude: [
        'src/**/__tests__/**',
        'src/main.js',
        'src/router/**',
        'mock/**',
      ],
    }
  }
});