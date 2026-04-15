import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicSrc = path.resolve(__dirname, 'public');
const outDir = path.resolve(__dirname, 'dist');

function copyPublicSafe(): Plugin {
  return {
    name: 'copy-public-safe',
    closeBundle() {
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      for (const entry of fs.readdirSync(publicSrc)) {
        const src = path.join(publicSrc, entry);
        const dest = path.join(outDir, entry);
        try {
          if (fs.statSync(src).isFile()) {
            fs.copyFileSync(src, dest);
          }
        } catch {
          /* skip locked/inaccessible files */
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyPublicSafe()],
  publicDir: 'public',
  build: {
    copyPublicDir: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
