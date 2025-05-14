// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
// import tailwind from "@astrojs/tailwind"; // Temporarily commented out

// https://astro.build/config
export default defineConfig({
  // integrations: [react(), tailwind()], // Temporarily commented out
  integrations: [react()],

  server: {
    // Configure HMR to work better in container/WSL environments
    hmr: {
      // Use the same port as the main server for the HMR client connection
      clientPort: 4321,
      // Optionally, explicitly set the host if needed, e.g., 'localhost' or '0.0.0.0'
      host: 'localhost',
    },
    // Add proxy for API requests
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': 'http://localhost:8000',
      },
    },
  }
});