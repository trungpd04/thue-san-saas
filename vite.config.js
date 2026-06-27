import { defineConfig, loadEnv } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    /** Same value as Laravel config('app.name'); Vite does not expand "${APP_NAME}" in .env files */
    const appName =
        process.env.VITE_APP_NAME ||
        process.env.APP_NAME ||
        env.VITE_APP_NAME ||
        env.APP_NAME ||
        'Laravel';

    return {
        define: {
            'import.meta.env.VITE_APP_NAME': JSON.stringify(appName),
        },
        plugins: [
            laravel({
                input: ['resources/js/app.tsx', 'resources/css/app.css'],
                refresh: true,
            }),
            react(),
        ],
    }
})
