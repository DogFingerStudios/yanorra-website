import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import Asciidoctor from '@asciidoctor/core'
import MapPanel from './MapPanel'

interface AsciiDocPageProps
{
  asciidocPath: string
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

const AsciiDocPage = ({ asciidocPath }: AsciiDocPageProps) =>
{
  const navigate = useNavigate()
  const [html, setHtml] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() =>
  {
    const loadAndRenderAsciidoc = async () =>
    {
      try
      {
        setLoading(true)
        setError(null)

        // Fetch raw AsciiDoc file
        const response = await fetch(asciidocPath)
        if (!response.ok)
        {
          throw new Error(`Failed to load AsciiDoc: ${response.statusText}`)
        }

        const adocContent = await response.text()

        // Initialize Asciidoctor
        const asciidoctor = Asciidoctor()

        // Convert to HTML
        const rawHtml = asciidoctor.convert(adocContent, {
          safe: 'safe',
          attributes: { showtitle: true }
        })

        // Replace <MapElement> tags with placeholders
        const processedHtml = (rawHtml as string).replace(
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

    loadAndRenderAsciidoc()
  }, [asciidocPath])

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
        
        // Parse zoom and center from config
        const zoom = config.zoom ? parseInt(config.zoom, 10) : 3
        const center = config.center 
          ? config.center.split(',').map((c) => parseFloat(c.trim())) as [number, number]
          : [-55.94, 111.88] as [number, number]
        const minZoom = config.minZoom ? parseInt(config.minZoom, 10) : 3
        const maxZoom = config.maxZoom ? parseInt(config.maxZoom, 10) : 6
        const scrollWheelZoom = config.scrollWheelZoom !== 'false'
        const debug = config.debug === 'true'
        
        // Create a container for the React map component
        const mapContainer = document.createElement('div')
        mapContainer.className = 'embedded-map'
        mapContainer.style.width = '100%'
        mapContainer.style.height = '500px'
        mapContainer.style.margin = '20px 0'
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
        <button onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
          ← Back
        </button>
        <div style={{ color: 'red' }}>Error: {error}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
        ← Back
      </button>
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

export default AsciiDocPage
