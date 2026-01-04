// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // 支持 TS/TSX 编译

// API地址配置 - 只需要修改这里即可切换所有API地址
// 本地开发环境
const API_BASE_URL = 'http://localhost:3000'
// const API_BASE_URL = 'http://127.0.0.1:3000'

// 测试环境
// const API_BASE_URL = 'http://192.168.1.100:3000'

// 线上服务器后端（默认启用）
// const API_BASE_URL = 'http://123.57.81.94'

export default defineConfig({
  plugins: [react()], // 该插件自动处理 TS/TSX
  resolve: {
    alias: {
      '@': '/src', // 和 tsconfig.json 的 paths 保持一致
    },
  },
  server: {
    proxy: {
      '/api': {
        target: API_BASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  // 配置环境变量，供代码中使用
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(API_BASE_URL),
  },
})
