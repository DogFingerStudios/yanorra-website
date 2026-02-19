import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig(
{
  publicDir: 'public',
  plugins: 
  [
    react(),
    {
      name: 'copy-yaml-wiki',
      buildStart()
      {
        const wikiSrc = path.resolve(__dirname, 'Yanorra', 'Wiki')
        const wikiDest = path.resolve(__dirname, 'public', 'Yanorra', 'Wiki')
        
        if (fs.existsSync(wikiSrc))
        {
          fs.mkdirSync(wikiDest, { recursive: true })
          
          const files = fs.readdirSync(wikiSrc)
          files.forEach((file) =>
          {
            if (file.endsWith('.md') || file.endsWith('.adoc'))
            {
              fs.copyFileSync(
                path.join(wikiSrc, file),
                path.join(wikiDest, file)
              )
            }
          })
          
          console.log('✓ Copied Wiki markdown/asciidoc files to public')
        }
      }
    }
  ],
})
