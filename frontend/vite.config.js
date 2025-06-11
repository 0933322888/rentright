import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.FRONT_ENV === 'production' ? process.env.PROD_FRONTEND_PORT : process.env.DEV_FRONTEND_PORT),
    host: '0.0.0.0',
    allowedHosts: ['rentright-m1md.onrender.com', 'localhost']
  },
})
