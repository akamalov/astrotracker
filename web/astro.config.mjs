// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  server: {
    // Configure HMR to work better in container/WSL environments
    hmr: {
      // Use the same port as the main server for the HMR client connection
      clientPort: 4321,
      // Optionally, explicitly set the host if needed, e.g., 'localhost' or '0.0.0.0'
      host: 'localhost',
    }
  }
});