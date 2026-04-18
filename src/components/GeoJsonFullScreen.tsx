import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GeoJSON, ImageOverlay, MapContainer, useMap } from 'react-leaflet'
import L from 'leaflet'
import './MapFullScreen.css'

// Add your GeoJSON file URLs here (must be publicly served paths, usually from /public).
const GEOJSON_FILES = [
//   '/geojson/States.geojson',
  '/geojson/StatesExport.geojson'
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
        const response = await fetch(filePath)

        if (!response.ok)
        {
          throw new Error(`Unable to load ${filePath} (${response.status})`)
        }

        const payload = (await response.json()) as GeoJSON.GeoJsonObject
        loadedEntries.push({ id: filePath, data: payload })
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
            return (
              <GeoJSON
                key={entry.id}
                data={entry.data}
                style={() =>
                {
                  return {
                    color: '#1F6FEB',
                    weight: 2,
                    fillOpacity: 0.15,
                  }
                }}
              />
            )
          })}
          <GeoJsonBoundsFitter entries={entries} />
        </MapContainer>
        {loadError ? <div className="geojson-error-banner">{loadError}</div> : null}
      </div>
    </div>
  )
}

export default GeoJsonFullScreen
