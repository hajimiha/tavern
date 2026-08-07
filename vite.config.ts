import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@phosphor-icons')) return 'vendor-icons'
          if (id.includes('dexie')) return 'vendor-storage'
          if (id.includes('react')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
})
