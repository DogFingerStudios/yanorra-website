import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { GeoJSON, ImageOverlay, MapContainer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getBiomesLayer } from './layers/Biomes'
import { getTownLayer } from './layers/TownLayer'
import { getStatesLayer } from './layers/States'
import 'leaflet/dist/leaflet.css'
import './MapFullScreen.css'

type GeoJsonLayerOptions =
{
  srcFile: string
  color?: string
  fillColor?: string
  weight?: number
  fillOpacity?: number
  minZoom?: number
  maxZoom?: number
  drawFunc?: (entry: GeoJsonEntry) => ReactNode
}

const DEFAULT_LAYER_OPTIONS =
{
  color: '#0000ff',
  fillColor: '#7bd5e9',
  weight: 2,
  fillOpacity: 1,
  minZoom: 0,
  maxZoom: Number.POSITIVE_INFINITY,
}

// Add your GeoJSON file URLs here (must be publicly served paths, usually from /public).
const GEOJSON_FILES : GeoJsonLayerOptions[] = 
[
  {
    srcFile: '/geojson/Land.geojson',
    color: '#7bd5e9',
    fillColor: '#ffffff',
    weight: 1,
    fillOpacity: 1,
  },
  {
    srcFile: '/geojson/Biomes.geojson',
    color: '#7bd5e9',
    fillColor: '#ffffff',
    weight: 1,
    fillOpacity: .75,
    drawFunc: getBiomesLayer,
  },
  {
    srcFile: '/geojson/Lakes.geojson',
    color: '#7bd5e9',
  },
  {
    srcFile: '/geojson/Rivers.geojson',
    color: '#7bd5e9',
    weight: 1.5,
  },
  {
    srcFile: '/geojson/StatesData.geojson',
    color: '#000000',
    weight: 1,
    fillOpacity: 0,
    drawFunc: getStatesLayer,
  },
  {
    srcFile: '/geojson/Routes.geojson',
    weight: 1,
    color: '#5a5a5a',
    minZoom: 3,
  },
  {
    srcFile: '/geojson/TownsData.geojson',
    maxZoom: 8,
    fillOpacity: 0,
    drawFunc: getTownLayer,
  },
  {
    srcFile: '/geojson/Town1.geojson',
    weight: 0.75,
    color: '#000000',
    minZoom: 3,
  },
]

const MIN_ZOOM = 2
const MAX_ZOOM = 16
const DEFAULT_CENTER: [number, number] = [0, 0]

// Set this to your Earth raster path in /public.
const EARTH_LAYER_FILE = '/geojson/Earth.png'
const EARTH_LAYER_BOUNDS: L.LatLngBoundsExpression = [
  [-90, -180],
  [90, 180],
]

type GeoJsonEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options: GeoJsonLayerOptions
}

type GeoJsonFullScreenProps =
{
  fullScreen?: boolean
  initialZoom?: number
  initialCenter?: [number, number]
  minZoom?: number
  maxZoom?: number
  scrollWheelZoom?: boolean
  debug?: boolean
  showFullScreenLink?: boolean
}

const DebugTracker = ({ onZoom, onCenter }: { onZoom: (z: number) => void, onCenter: (c: [number, number]) => void }) =>
{
  useMapEvents({
    zoomend: (e) =>
    {
      onZoom(e.target.getZoom())
      const c = e.target.getCenter()
      onCenter([c.lat, c.lng])
    },
    moveend: (e) =>
    {
      const c = e.target.getCenter()
      onCenter([c.lat, c.lng])
    },
  })
  return null
}

const GeoJsonBoundsFitter = ({ entries }: { entries: GeoJsonEntry[] }) =>
{
  const map = useMap()

  useEffect(() =>
  {
    if (entries.length === 0)
    {
      return
    }

    const combinedBounds = L.latLngBounds([])

    entries.forEach((entry) =>
    {
      const layer = L.geoJSON(entry.data)

      if (layer.getLayers().length > 0)
      {
        combinedBounds.extend(layer.getBounds())
      }
    })

    if (combinedBounds.isValid())
    {
      map.fitBounds(combinedBounds.pad(0.08))
    }
  }, [entries, map])

  return null
}

const GeoJsonFullScreen = (
  {
    fullScreen = true,
    initialZoom = 2,
    initialCenter = DEFAULT_CENTER,
    minZoom = MIN_ZOOM,
    maxZoom = MAX_ZOOM,
    scrollWheelZoom = true,
    debug = true,
    showFullScreenLink = false,
  }: GeoJsonFullScreenProps
) =>
{
  const [entries, setEntries] = useState<GeoJsonEntry[]>([])
  const [loadError, setLoadError] = useState('')
  const [isEarthLayerVisible, setIsEarthLayerVisible] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(initialZoom)
  const [coords, setCoords] = useState<[number, number]>(initialCenter)
  const [copyMessage, setCopyMessage] = useState('')

  useEffect(() =>
  {
    setCurrentZoom(initialZoom)
    setCoords([initialCenter[0], initialCenter[1]])
  }, [initialZoom, initialCenter[0], initialCenter[1]])

  const navigateTo = (path: string) =>
  {
    window.location.assign(path)
  }

  const toggleEarthLayer = () =>
  {
    if (isEarthLayerVisible)
    {
      setIsEarthLayerVisible(false)
      return
    }

    setIsEarthLayerVisible(true)
  }

  useEffect(() =>
  {
    let isMounted = true

    const loadGeoJsonFiles = async () =>
    {
      const loadedEntries: GeoJsonEntry[] = []

      for (const filePath of GEOJSON_FILES)
      {
        const response = await fetch(filePath.srcFile)

        if (!response.ok)
        {
          console.error(`Failed to load ${filePath.srcFile}: ${response.statusText}`)
          throw new Error(`Unable to load ${filePath.srcFile} (${response.status})`)
        }

        const payload = (await response.json()) as GeoJSON.GeoJsonObject
        loadedEntries.push({ id: filePath.srcFile, data: payload, options: filePath})
      }

      if (isMounted)
      {
        setEntries(loadedEntries)
      }
    }

    loadGeoJsonFiles()
      .then(() =>
      {
        if (isMounted)
        {
          setLoadError('')
        }
      })
      .catch((error: unknown) =>
      {
        if (!isMounted)
        {
          return
        }

        if (error instanceof Error)
        {
          setLoadError(error.message)
          return
        }

        setLoadError('Failed to load GeoJSON files.')
      })

    return () =>
    {
      isMounted = false
    }
  }, [])

  const copyToClipboard = async (value: string) =>
  {
    if (navigator.clipboard && navigator.clipboard.writeText)
    {
      await navigator.clipboard.writeText(value)
      return
    }

    const textArea = document.createElement('textarea')
    textArea.value = value
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  const copyZoom = async () =>
  {
    await copyToClipboard(`Zoom Level: ${currentZoom}`)
    setCopyMessage('Copied zoom level')
    setTimeout(() => setCopyMessage(''), 1200)
  }

  const copyCenter = async () =>
  {
    const centerValue = `${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}`
    await copyToClipboard(centerValue)
    setCopyMessage('Copied coords: ' + centerValue)
    setTimeout(() => setCopyMessage(''), 1200)
  }

  const renderDebug = () =>
  {
    if (!debug)
    {
      return null
    }

    return (
      <>
        <div className="zoom-indicator" onClick={copyZoom} title="Click to copy zoom value">
          Zoom Level: {currentZoom}
        </div>
        <div className="coords-indicator" onClick={copyCenter} title="Click to copy center value">
          Center: [{coords[0].toFixed(2)}, {coords[1].toFixed(2)}]
        </div>
        {copyMessage ? <div className="copy-notification">{copyMessage}</div> : null}
      </>
    )
  }

  let earthLayerTitle = 'Turn Earth layer on'

  if (isEarthLayerVisible)
  {
    earthLayerTitle = 'Turn Earth layer off'
  }

  let earthLayerElement = null

  if (isEarthLayerVisible)
  {
    earthLayerElement = (
      <ImageOverlay url={EARTH_LAYER_FILE} bounds={EARTH_LAYER_BOUNDS} />
    )
  }

  let fullScreenLinkElement = null

  if (showFullScreenLink && !fullScreen)
  {
    fullScreenLinkElement = (
      <div className="leaflet-top leaflet-left" style={{ marginTop: '184px' }}>
        <div className="leaflet-control leaflet-bar">
          <button
            type="button"
            onClick={() => navigateTo('/map')}
            title="Open full screen map"
            aria-label="Open full screen map"
            style={{
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              borderRadius: 0,
              padding: 0,
            }}
          >
            🌐
          </button>
        </div>
      </div>
    )
  }

  let fullScreenControlsElement = null

  if (fullScreen)
  {
    fullScreenControlsElement = (
      <>
        <div className="leaflet-top leaflet-left" style={{ marginTop: '12px' }}>
          <div className="leaflet-control leaflet-bar">
            <button
              type="button"
              onClick={toggleEarthLayer}
              title={earthLayerTitle}
              aria-label="Toggle Earth layer"
              style={{
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                borderRadius: 0,
                padding: 0,
              }}
            >
              E
            </button>
          </div>
        </div>
        <div className="leaflet-top leaflet-left" style={{ marginTop: '48px' }}>
          <div className="leaflet-control leaflet-bar">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              title="Close map"
              aria-label="Close map"
              style={{
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                borderRadius: 0,
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </>
    )
  }

  const boundsFitterElement = fullScreen ? <GeoJsonBoundsFitter entries={entries} /> : null

  return (
    <div className="map-fullscreen-container">
      <div className="map-main">
        <MapContainer
          key={`geojson-map-${initialCenter[0]}-${initialCenter[1]}-${initialZoom}-${minZoom}-${maxZoom}`}
          center={initialCenter}
          zoom={initialZoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          scrollWheelZoom={scrollWheelZoom}
          style={{ height: '100%', width: '100%', backgroundColor: '#7bd5e9' }}
          attributionControl={false}
          crs={L.CRS.EPSG4326}
        >
          {earthLayerElement}
          {entries.map((entry) =>
          {
            const minZoom = entry.options.minZoom ?? 0
            const maxZoom = entry.options.maxZoom ?? Number.POSITIVE_INFINITY

            if (currentZoom < minZoom || currentZoom > maxZoom)
            {
              return null
            }

            if (entry.options.drawFunc)
            {
              return entry.options.drawFunc(entry)
            }

            return (
              <GeoJSON key={entry.id} data={entry.data} style={() =>
                {
                  const options = {
                    ...DEFAULT_LAYER_OPTIONS,
                    ...entry.options,
                  }

                  return { 
                    color: options.color, 
                    weight: options.weight, 
                    fillColor: options.fillColor,
                    fillOpacity: options.fillOpacity,
                  }
                }}
              />
            )

          })}
          {boundsFitterElement}
          <DebugTracker onZoom={setCurrentZoom} onCenter={setCoords} />
          {fullScreenLinkElement}
          {fullScreenControlsElement}
        </MapContainer>
        {renderDebug()}
        {loadError ? <div className="geojson-error-banner">{loadError}</div> : null}
      </div>
    </div>
  )
}

export default GeoJsonFullScreen
