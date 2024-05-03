import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import resolve from '@rollup/plugin-node-resolve';
import inject from '@rollup/plugin-inject'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: "./",
    define:
      mode === 'development' ?
        {
          'process.env.SOME_KEY': JSON.stringify(env.SOME_KEY),
          'global': {}
        } : {
          'process.env.SOME_KEY': JSON.stringify(env.SOME_KEY),
        },
    build:
      mode === 'production'
        ? {
          rollupOptions: {
            plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
          },
        }
        : undefined,

    optimizeDeps: {
      include: ['@emotion/styled'],
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis'
        },
        // Enable esbuild polyfill plugins
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true
          })
        ]
      }
    },
    resolve: {
      alias: {
        crypto: 'crypto-browserify'
      }
    },
    plugins:
      [
        react(),
        resolve({
          browser: true,
          preferBuiltins: false,
        })
      ],
  }
})