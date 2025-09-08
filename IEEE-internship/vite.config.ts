import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    // Use basic SSL for HTTPS (required for camera access)
    // This creates self-signed certificates automatically
    basicSsl()
  ],
  server: {
    port: 5173,
    host: true, // Allow access from network (for mobile testing)
    // HTTPS is automatically enabled by basicSsl plugin
  },
})
