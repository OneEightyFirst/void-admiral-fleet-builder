import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ 
  plugins: [react()], 
  server: { port: 5173 },
  build: {
    // Enable minification
    minify: 'terser',
    // Split chunks to reduce individual file sizes
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    },
    // Reduce chunk size warning limit since we're splitting
    chunkSizeWarningLimit: 600
  }
})
