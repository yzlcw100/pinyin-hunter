import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 代码分割：路由级懒加载（React.lazy + Suspense）
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React 生态单独打包
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // zustand 单独打包
          if (id.includes('node_modules/zustand/')) {
            return 'vendor-zustand';
          }
          // react-router-dom 单独打包
          if (id.includes('node_modules/react-router/') || id.includes('node_modules/history/')) {
            return 'vendor-router';
          }
        },
      },
    },
    // 打包体积警告阈值（目标 < 500KB）
    chunkSizeWarningLimit: 500,
  },
})
