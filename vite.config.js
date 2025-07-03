// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
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
    host: '0.0.0.0',
    port: 4173,
    cors: true,
    proxy: {
      '/api': {
          // 目标主机地址
          target: 'http://192.168.2.57', 
          changeOrigin: true,
          // 把前端请求路径中的 /api 替换为后端的 /prod-api
          rewrite: (path) => path.replace(/^\/api/, '/prod-api'),
        },

        // 规则二：代理 WebRTC 服务
        '/webrtc-api': {
          target: 'http://192.168.2.57',
          changeOrigin: true,
          // 注意：这里前端的"暗号"和后端的路径完全一样，
          // 所以我们甚至不需要 rewrite，代理会自动拼接。
          // Vite 会把 /webrtc-api/stream/start 转发到 http://192.168.2.57/webrtc-api/stream/start
        },

        // 规则三：代理摄像头服务
        '/easy-api': {
          target: 'http://192.168.2.57',
          changeOrigin: true,
          // 这里也一样，前端暗号和后端路径一致，无需 rewrite
        },
    }
  },
  assetsInclude: ['**/*.wasm'],  // 添加对wasm文件的支持
  optimizeDeps: {
    exclude: ['@easydarwin/easyplayer'] // 排除EasyPlayer依赖以避免预构建问题
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