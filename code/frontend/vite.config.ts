import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const apiTarget = process.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true,
            },
            '/media': {
                target: apiTarget,
                changeOrigin: true,
            },
        },
    },
});
