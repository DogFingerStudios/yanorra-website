import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { asciidocPlugin } from './vite-plugin-asciidoc'
import { markdownPlugin } from './vite-plugin-markdown'

// https://vite.dev/config/
export default defineConfig(
{
  plugins: 
  [
    react(), 
    asciidocPlugin(),
    markdownPlugin()
  ],
})
