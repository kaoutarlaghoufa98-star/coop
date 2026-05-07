import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-web',
    rollupOptions: {
      input: 'src/main.jsx'
    }
  },
  server: {
    port: 3000
  }
})