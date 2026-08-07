import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
            if (id.includes('framer-motion') || id.includes('motion')) return 'vendor-motion';
            if (id.includes('@xenova') || id.includes('transformers')) return 'vendor-transformers';
            if (id.includes('@openrouter') || id.includes('sarvamai') || id.includes('streamdown')) return 'vendor-ai';
            if (id.includes('@radix-ui') || id.includes('lucide') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) return 'vendor-ui';
            if (id.includes('@fontsource')) return 'vendor-fonts';
            return 'vendor';
          }
        }
      }
    }
  }
})


