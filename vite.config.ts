import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as path from 'path'
import { dispatchApiRequest } from './scripts/apiRouter'

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
        const aboutSrc = path.resolve(__dirname, 'src', 'content', 'ABOUT.md')
        const aboutDest = path.resolve(__dirname, 'public', 'ABOUT.md')
        
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

        const docsSrc = path.resolve(__dirname, 'Yanorra')
        const docsDest = path.resolve(__dirname, 'public', 'Yanorra')

        if (fs.existsSync(docsSrc))
        {
          fs.mkdirSync(docsDest, { recursive: true })

          const files = fs.readdirSync(docsSrc)
          files.forEach((file) =>
          {
            if (file.endsWith('.md'))
            {
              fs.copyFileSync(
                path.join(docsSrc, file),
                path.join(docsDest, file)
              )
            }
          })

          console.log('✓ Copied Yanorra root markdown files to public')
        }

        if (fs.existsSync(aboutSrc))
        {
          fs.copyFileSync(aboutSrc, aboutDest)
          console.log('✓ Copied ABOUT.md to public')
        }
      }
    },
    {
      name: 'api-router',
      configureServer(server)
      {
        server.middlewares.use((req, res, next) =>
        {
          const handled = dispatchApiRequest(req, res, __dirname)

          if (handled)
          {
            return
          }

          next()
        })
      },
      configurePreviewServer(server)
      {
        server.middlewares.use((req, res, next) =>
        {
          const handled = dispatchApiRequest(req, res, __dirname)

          if (handled)
          {
            return
          }

          next()
        })
      }
    }
  ],
})
