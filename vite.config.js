import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'



// simulate __dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const localConfig = {
  plugins: [tailwindcss(), react()],
  server: {
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.pem')),
    },
    port: 5173,
  },
}

const normalConfig ={
    plugins: [
        react(),
        tailwindcss()
    ],
}

export default defineConfig(normalConfig);
