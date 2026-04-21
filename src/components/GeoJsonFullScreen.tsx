import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GeoJSON, ImageOverlay, MapContainer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getTownLayer } from './layers/TownLayer'
import { getStatesLayer } from './layers/States'
import './MapFullScreen.css'

class GeoJsonLayer
{
  srcFile: string = ''
  color?: string = '#0000ff'
  fillColor?: string = '#00ffff'
  weight?: number = 2
  fillOpacity?: number = 1
  minZoom?: number = 0
  maxZoom?: number = Number.POSITIVE_INFINITY
}

// Add your GeoJSON file URLs here (must be publicly served paths, usually from /public).
const GEOJSON_FILES : GeoJsonLayer[] = 
[
  {
    srcFile: '/geojson/Land.geojson',
    color: '#7bd5e9',
    fillColor: '#ffffff',
    weight: 1,
    fillOpacity: 1,
  },
  {
    srcFile: '/geojson/Rivers.geojson',
    color: '#7bd5e9',
    weight: 0.625,
  },
  {
    srcFile: '/geojson/States.geojson',
    color: '#000000',
    weight: 1,
    fillOpacity: 0,
  },
  {
    srcFile: '/geojson/Routes.geojson',
    weight: 0.75,
    color: '#000000',
    minZoom: 3,
  },
  {
    srcFile: '/geojson/Towns.geojson',
    maxZoom: 6,
    fillOpacity: 0,
  }
]

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
  options: GeoJsonLayer
}

const debug = true

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

const GeoJsonFullScreen = () =>
{
  const navigate = useNavigate()
  const [entries, setEntries] = useState<GeoJsonEntry[]>([])
  const [loadError, setLoadError] = useState('')
  const [isEarthLayerVisible, setIsEarthLayerVisible] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(2)
  const [coords, setCoords] = useState<[number, number]>([0, 0])
  const [copyMessage, setCopyMessage] = useState('')

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

  let earthLayerLabel = 'Earth Off'

  if (isEarthLayerVisible)
  {
    earthLayerLabel = 'Earth On'
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

  return (
    <div className="map-fullscreen-container">
      <div className="map-sidebar">
        <div className="map-sidebar-top">
          <button
            className="numbered-button"
            onClick={toggleEarthLayer}
            aria-label="Toggle Earth layer"
            aria-pressed={isEarthLayerVisible}
            title={earthLayerTitle}
          >
            {earthLayerLabel}
          </button>
        </div>
        <div className="map-sidebar-bottom">
          <button
            className="close-button"
            onClick={() => navigate('/')}
            aria-label="Close beta map"
            title="Close beta map"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="map-main">
        <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} attributionControl={false} crs={L.CRS.EPSG4326}>
          {earthLayerElement}
          {entries.map((entry) =>
          {
            const minZoom = entry.options.minZoom ?? 0
            const maxZoom = entry.options.maxZoom ?? Number.POSITIVE_INFINITY

            if (currentZoom < minZoom || currentZoom > maxZoom)
            {
              return null
            }

            if (entry.options.srcFile.toLowerCase().endsWith('/towns.geojson'))
            {
              return getTownLayer(entry)
            }

            if (entry.options.srcFile.toLowerCase().endsWith('/states.geojson'))
            {
              return getStatesLayer(entry)
            }

            return (
              <GeoJSON key={entry.id} data={entry.data} style={() =>
                {
                  return { 
                    color: entry.options.color, 
                    weight: entry.options.weight, 
                    fillColor: entry.options.fillColor,
                    fillOpacity: entry.options.fillOpacity ,
                  }
                }}
              />
            )

          })}
          <GeoJsonBoundsFitter entries={entries} />
          <DebugTracker onZoom={setCurrentZoom} onCenter={setCoords} />
        </MapContainer>
        {renderDebug()}
        {loadError ? <div className="geojson-error-banner">{loadError}</div> : null}
      </div>
    </div>
  )
}

export default GeoJsonFullScreen
