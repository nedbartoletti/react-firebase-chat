import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from 'rollup-plugin-polyfill-node'
const { nodePolyfills } = pkg

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
      },
    })
  ],
  define: {
    'global': 'window',
  }
})