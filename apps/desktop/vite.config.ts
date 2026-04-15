import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      electron([
        {
          entry: 'electron/main.ts',
          onstart(options) {
            options.startup(['.', '--dev-server-url', `http://localhost:${options.viteDevServer?.config.server.port || 5173}`]);
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              sourcemap: true,
              rollupOptions: {
                external: ['electron', 'electron-store'],
              },
            },
            resolve: {
              alias: {
                '@thegist/shared': resolve(__dirname, '../../packages/shared/src'),
              },
            },
            define: {
              'process.env.NODE_ENV': JSON.stringify(mode),
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            options.reload();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              sourcemap: true,
              rollupOptions: {
                external: ['electron'],
              },
            },
            resolve: {
              alias: {
                '@thegist/shared': resolve(__dirname, '../../packages/shared/src'),
              },
            },
          },
        },
      ]),
      electronRenderer(),
    ],
    resolve: {
      alias: {
        '@thegist/shared': resolve(__dirname, '../../packages/shared/src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
