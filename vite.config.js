import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // 백엔드 서버 주소
        changeOrigin: true,
        secure: false,
      }
    },
    historyApiFallback: true // 추가: 클라이언트 사이드 라우팅을 위한 fallback 설정
  }
})
