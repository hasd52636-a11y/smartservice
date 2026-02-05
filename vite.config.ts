import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3003,
    host: '0.0.0.0',
    proxy: {
      // 移除API代理，让Vite直接处理API端点
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 只有当模块实际被使用时才创建chunk
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('lucide-react') || id.includes('recharts')) {
              return 'ui';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  plugins: [react()],
  define: {
    // 移除硬编码的环境变量，让Vercel自动注入
    'process.env.API_KEY': JSON.stringify(''),
    'process.env.ZHIPU_API_KEY': JSON.stringify('')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
