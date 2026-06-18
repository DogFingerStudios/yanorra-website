import { defineConfig, type Connect, type PluginOption, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import { dispatchApiRequest } from './scripts/apiRouter'

function copyYamlWikiPlugin(): PluginOption
{
  return {
    name: 'copy-yaml-wiki',
    buildStart()
    {
        const imagesSrc = path.resolve(__dirname, 'yanorra-wiki', 'Images')
        if (fs.existsSync(imagesSrc))
        {
            const imagesDest = path.resolve(__dirname, 'public', 'Images')
            fs.mkdirSync(imagesDest, { recursive: true })

            const files = fs.readdirSync(imagesSrc)
            files.forEach((file) =>
            {
                fs.copyFileSync(
                    path.join(imagesSrc, file),
                    path.join(imagesDest, file)
                )
            })

            console.log('✓ Copied Wiki images to public')
        }
        else
        {
            console.warn('Warning: Wiki images directory not found, skipping copy')
        }

        const wikiSrc = path.resolve(__dirname, 'yanorra-wiki', 'Wiki')
        if (fs.existsSync(wikiSrc))
        {
            const wikiDest = path.resolve(__dirname, 'public', 'yanorra-wiki', 'Wiki')
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
        else
        {
            console.warn('Warning: Wiki docs directory not found, skipping copy')
        }

        const docsSrc = path.resolve(__dirname, 'yanorra-wiki')
        if (fs.existsSync(docsSrc))
        {
            const docsDest = path.resolve(__dirname, 'public', 'yanorra-wiki')
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
        else
        {
            console.warn('Warning: Yanorra root docs directory not found, skipping copy')
        }

        const mapsSrc = path.resolve(__dirname, 'yanorra-maps', 'QGIS')
        if (fs.existsSync(mapsSrc))
        {
            const docsDest = path.resolve(__dirname, 'public', 'geojson')
            fs.mkdirSync(docsDest, { recursive: true })

            fs.copyFileSync(path.join(mapsSrc, 'export', 'Earth.png'), path.join(docsDest, 'Earth.png'))
            fs.copyFileSync(path.join(mapsSrc, 'export', 'StatesData.geojson'), path.join(docsDest, 'StatesData.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'export', 'BiomesData.geojson'), path.join(docsDest, 'BiomesData.geojson'))

            fs.copyFileSync(path.join(mapsSrc, 'layers', 'generated', 'land.geojson'), path.join(docsDest, 'land.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'generated', 'height.geojson'), path.join(docsDest, 'height.geojson'))

            fs.copyFileSync(path.join(mapsSrc, 'layers', 'Land', 'Lakes.geojson'), path.join(docsDest, 'Lakes.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'Land', 'Rivers.geojson'), path.join(docsDest, 'Rivers.geojson'))

            fs.copyFileSync(path.join(mapsSrc, 'layers', 'labels', 'water_labels.geojson'), path.join(docsDest, 'water_labels.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'labels', 'landform_labels.geojson'), path.join(docsDest, 'landform_labels.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'labels', 'lore_labels.geojson'), path.join(docsDest, 'lore_labels.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'labels', 'political_line_labels.geojson'), path.join(docsDest, 'political_line_labels.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'labels', 'route_labels.geojson'), path.join(docsDest, 'route_labels.geojson'))

            fs.copyFileSync(path.join(mapsSrc, 'layers', 'settlements', 'settlements_points.geojson'), path.join(docsDest, 'settlements_points.geojson'))

            fs.copyFileSync(path.join(mapsSrc, 'layers', 'transportation', 'roads', 'generated', 'roads_highway_generated.geojson'), path.join(docsDest, 'roads_highway.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'transportation', 'roads', 'generated', 'roads_major_generated.geojson'), path.join(docsDest, 'roads_major.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'transportation', 'roads', 'generated', 'roads_minor_generated.geojson'), path.join(docsDest, 'roads_minor.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'transportation', 'railways.geojson'), path.join(docsDest, 'railways.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'transportation', 'seaways.geojson'), path.join(docsDest, 'seaways.geojson'))

            fs.copyFileSync(path.join(mapsSrc, 'layers', 'urban', 'generated', 'alleys_generated.geojson'), path.join(docsDest, 'alleys.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'urban', 'generated', 'streets_major_generated.geojson'), path.join(docsDest, 'streets_major.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'urban', 'generated', 'streets_minor_generated.geojson'), path.join(docsDest, 'streets_minor.geojson'))

            fs.copyFileSync(path.join(mapsSrc, 'layers', 'urban', 'buildings_major.geojson'), path.join(docsDest, 'buildings_major.geojson'))
            fs.copyFileSync(path.join(mapsSrc, 'layers', 'urban', 'parks.geojson'), path.join(docsDest, 'parks.geojson'))

            console.log('✓ Copied Yanorra Maps GeoJSON files to public')
        }
        else
        {
            console.warn('!! WARNING: Yanorra Maps directory not found, skipping copy')
        }

      const aboutSrc = path.resolve(__dirname, 'src', 'content', 'ABOUT.md')
      if (fs.existsSync(aboutSrc))
      {
        const aboutDest = path.resolve(__dirname, 'public', 'ABOUT.md')
        fs.copyFileSync(aboutSrc, aboutDest)
        console.log('✓ Copied ABOUT.md to public')
      }
    }
  }
}

function apiRouterPlugin(): PluginOption
{
  function attachApiRouter(server: ViteDevServer | PreviewServer)
  {
    server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) =>
    {
      const handled = dispatchApiRequest(req, res, __dirname)

      if (handled)
      {
        return
      }

      next()
    })
  }

  return {
    name: 'api-router',
    configureServer(server: ViteDevServer)
    {
      attachApiRouter(server)
    },
    configurePreviewServer(server: PreviewServer)
    {
      attachApiRouter(server)
    }
  }
}

// https://vite.dev/config/
export default defineConfig(
({ mode }) =>
{
  const shouldCopyDocs = mode !== 'lite'

  const plugins = [
    react(),
    apiRouterPlugin()
  ]

  if (shouldCopyDocs)
  {
    plugins.splice(1, 0, copyYamlWikiPlugin())
  }

  return {
    publicDir: 'public',
    plugins,
  }
})
