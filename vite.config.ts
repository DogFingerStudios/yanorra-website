import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { asciidocPlugin } from './vite-plugin-asciidoc'

// https://vite.dev/config/
export default defineConfig(
{
  plugins: 
  [
    react(), 
    asciidocPlugin([
      {
        source_file: 'data/README.adoc',
        destination_file: 'dist/data/README2.html'
      }
    ])
  ],
})
