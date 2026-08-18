import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const analyzer = env.PRESIDIO_ANALYZER_URL || 'http://192.168.178.89:5002'
  const anonymizer = env.PRESIDIO_ANONYMIZER_URL || 'http://192.168.178.89:5001'

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      host: true,
      port: 5180,
      strictPort: true,
      // Presidio ships without CORS headers, so the browser can never talk to it
      // directly. Everything goes through these same-origin proxy prefixes.
      proxy: {
        '/api/analyzer': {
          target: analyzer,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/analyzer/, ''),
        },
        '/api/anonymizer': {
          target: anonymizer,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/anonymizer/, ''),
        },
      },
    },
  }
})
