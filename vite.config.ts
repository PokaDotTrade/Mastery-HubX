import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This makes the build-time environment variables available in the client code.
    // Netlify will set `process.env.API_KEY` during the build.
    'process.env': process.env,
  },
})
