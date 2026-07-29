import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isAdmin = mode === 'admin';
  const isPos = mode === 'pos';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: isAdmin ? 'dist-admin' : isPos ? 'dist-pos' : 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        input: isAdmin
          ? path.resolve(__dirname, 'admin.html')
          : isPos
            ? path.resolve(__dirname, 'pos.html')
            : path.resolve(__dirname, 'index.html'),
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
