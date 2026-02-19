import { useEffect, useState, useRef } from 'react'
import { marked } from 'marked'
import { createRoot } from 'react-dom/client'
import MapPanel from './MapPanel'

interface MarkdownPageProps
{
  markdownPath: string
}

interface MapElementConfig
{
  map?: string
  zoom?: string
  center?: string
  minZoom?: string
  maxZoom?: string
  scrollWheelZoom?: string
  debug?: string
}

const MarkdownPage = ({ markdownPath }: MarkdownPageProps) =>
{
  const [html, setHtml] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() =>
  {
    const loadAndRenderMarkdown = async () =>
    {
      try
      {
        setLoading(true)
        setError(null)

        // Fetch raw markdown from Yanorra folder
        const response = await fetch(markdownPath)
        if (!response.ok)
        {
          throw new Error(`Failed to load markdown: ${response.statusText}`)
        }

        const markdown = await response.text()

        // Convert markdown to HTML with custom handling for <MapElement>
        const rawHtml = await marked(markdown)

        // Replace <MapElement> tags with placeholders
        const processedHtml = rawHtml.replace(
          /<MapElement\s+([^>]+)\/>/gi,
          (_match, attrs) =>
          {
            const config: MapElementConfig =
            {
            }
            
            // Parse attributes
            const attrRegex = /(\w+)="([^"]+)"/g
            let attrMatch
            while ((attrMatch = attrRegex.exec(attrs)) !== null)
            {
              const [, key, value] = attrMatch
              config[key as keyof MapElementConfig] = value
            }

            // Create a placeholder div with data attributes
            console.log('Created placeholder with config:', JSON.stringify(config))
            return `<div class="map-element-placeholder" data-config='${JSON.stringify(config)}'></div>`
          }
        )

        setHtml(processedHtml)
      }
      catch (err)
      {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
      finally
      {
        setLoading(false)
      }
    }

    loadAndRenderMarkdown()
  }, [markdownPath])

  // Hydrate map placeholders after HTML is rendered
  useEffect(() =>
  {
    if (!contentRef.current || !html)
    {
      return
    }

    const placeholders = contentRef.current.querySelectorAll('.map-element-placeholder')
    const roots: any[] = []
    
    placeholders.forEach((placeholder) =>
    {
      const configStr = placeholder.getAttribute('data-config')
      if (!configStr)
      {
        return
      }

      try
      {
        const config: MapElementConfig = JSON.parse(configStr)
        
        // Parse zoom, center, and zoom bounds from config with validation and defaults
        let zoom = 3
        if (typeof config.zoom === 'string')
        {
          const parsedZoom = parseInt(config.zoom, 10)
          if (!Number.isNaN(parsedZoom))
          {
            zoom = parsedZoom
          }
        }

        let center: [number, number] = [-55.94, 111.88]
        if (typeof config.center === 'string')
        {
          const parts = config.center.split(',')
          if (parts.length === 2)
          {
            const lat = parseFloat(parts[0].trim())
            const lng = parseFloat(parts[1].trim())
            if (!Number.isNaN(lat) && !Number.isNaN(lng))
            {
              center = [lat, lng]
            }
          }
        }

        let minZoom = 3
        if (typeof config.minZoom === 'string')
        {
          const parsedMinZoom = parseInt(config.minZoom, 10)
          if (!Number.isNaN(parsedMinZoom))
          {
            minZoom = parsedMinZoom
          }
        }

        let maxZoom = 6
        if (typeof config.maxZoom === 'string')
        {
          const parsedMaxZoom = parseInt(config.maxZoom, 10)
          if (!Number.isNaN(parsedMaxZoom))
          {
            maxZoom = parsedMaxZoom
          }
        }

        let scrollWheelZoom = true
        if (typeof config.scrollWheelZoom === 'string')
        {
          const scrollValue = config.scrollWheelZoom.toLowerCase()
          if (scrollValue === 'false')
          {
            scrollWheelZoom = false
          }
          else if (scrollValue === 'true')
          {
            scrollWheelZoom = true
          }
        }

        let debug = false
        if (config.debug === 'true')
        {
          debug = true
        }
        
        // Create a container for the React map component
        const mapContainer = document.createElement('div')
        mapContainer.className = 'embedded-map'
        mapContainer.style.width = '100%'
        mapContainer.style.height = '500px'
        mapContainer.style.margin = '1px 0'
        mapContainer.style.border = '2px solid #646cff'
        mapContainer.style.borderRadius = '8px'
        mapContainer.style.overflow = 'hidden'
        
        // Replace placeholder with container
        placeholder.replaceWith(mapContainer)
        
        // Mount React MapPanel into the container
        const root = createRoot(mapContainer)
        root.render(
          <MapPanel 
            fullScreen={false} 
            initialZoom={zoom} 
            initialCenter={center}
            minZoom={minZoom}
            maxZoom={maxZoom}
            scrollWheelZoom={scrollWheelZoom}
            debug={debug}
          />
        )
        roots.push(root)
        
        console.log('Mounted MapPanel with config:', { zoom, center, minZoom, maxZoom, scrollWheelZoom, debug, original: config })
      }
      catch (err)
      {
        console.error('Failed to parse map config:', err)
      }
    })

    // Cleanup function to unmount React roots
    return () =>
    {
      roots.forEach((root) =>
      {
        root.unmount()
      })
    }
  }, [html])

  if (loading)
  {
    return (
      <div style={{ padding: '2rem' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (error)
  {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ color: 'red' }}>Error: {error}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div 
        ref={contentRef}
        dangerouslySetInnerHTML={
          {
            __html: html
          }
        }
      />
    </div>
  )
}

export default MarkdownPage
