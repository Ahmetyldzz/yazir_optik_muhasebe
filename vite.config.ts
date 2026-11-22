import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type ProxyOptions} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend: ProxyOptions = {
    target: env.BACKEND_URL || 'http://127.0.0.1:3001',
    changeOrigin: true,
    configure(proxy) {
      proxy.on('proxyReq', (proxyRequest, request) => {
        const origin = request.headers.origin;
        const sameOrigin = origin === 'http://' + request.headers.host || origin === 'https://' + request.headers.host;
        if (!origin || sameOrigin) {
          proxyRequest.removeHeader('origin');
          if (env.BACKEND_API_TOKEN) proxyRequest.setHeader('Authorization', 'Bearer ' + env.BACKEND_API_TOKEN);
        }
      });
    },
  };
  const proxy = { '^/api(?:/|$)': backend };
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    preview: { host: '127.0.0.1', proxy },
    server: {
      proxy,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
