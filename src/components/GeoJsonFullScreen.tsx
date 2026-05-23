import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { GeoJSON, ImageOverlay, LayerGroup, MapContainer, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import MapRightPanel from './MapRightPanel'
import L from 'leaflet'
import { getBiomesLayer } from './layers/Biomes'
// import { getTownLayer } from './layers/TownLayer'
import { getSettlementPointsLayer } from './layers/SettlmentPoints'
import { getStatesLayer } from './layers/States'
import { getRailwayLayer } from './layers/RailwayLayer'
import { getSeawayLayer } from './layers/SeawayLayer'
import { getStreetsLayer } from './layers/StreetsLayer'
import { getRoutesLayer } from './layers/Routes'
import { getLabelsLayer } from './layers/LabelsLayer'
import { getBuildingsLayer } from './layers/BuildingsLayer'
import { getParksLayer } from './layers/ParksLayer'
import { getSettlementPointsPopup } from './layers/SettlementPointsPopup.tsx'
import 'leaflet/dist/leaflet.css'
import './ScaleControl.css'
import './MapFullScreen.css'

const MIN_ZOOM = 2
const MAX_ZOOM = 20
const DEFAULT_CENTER: [number, number] = [0, 0]
const DEFAULT_MAP_LAYER = 'land'

type GeoJsonLayerOptions =
{
  id?: string
  srcFile: string
  pane?: string
  color?: string
  fillColor?: string
  weight?: number
  fillOpacity?: number
  minZoom?: number
  maxZoom?: number
  drawFunc?: (entry: GeoJsonEntry) => ReactNode
  popupFunc?: (feature: GeoJSON.Feature, entry: GeoJsonEntry) => string
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

const BASE_GEOJSON_PANE = 'baseGeoJsonPane'
const BASE_GEOJSON_Z_INDEX = '200'

// Add your GeoJSON file URLs here (must be publicly served paths, usually from /public).
const GEOJSON_FILES : GeoJsonLayerOptions[] = 
[
  {
    id: 'land',
    srcFile: '/geojson/land.geojson',
    pane: BASE_GEOJSON_PANE,
    color: '#7bd5e9',
    fillColor: '#ffffff',
    weight: 1,
    fillOpacity: 1,
  },
  {
    id: 'biomes',
    srcFile: '/geojson/BiomesData.geojson',
    pane: BASE_GEOJSON_PANE,
    color: '#7bd5e9',
    fillColor: '#ffffff',
    weight: 1,
    fillOpacity: .75,
    drawFunc: getBiomesLayer,
  },
  {
    id: 'lakes',
    srcFile: '/geojson/Lakes.geojson',
    color: '#7bd5e9',
  },
  {
    id: 'rivers',
    srcFile: '/geojson/Rivers.geojson',
    color: '#7bd5e9',
    weight: 1.5,
  },
  {
    id: 'states',
    srcFile: '/geojson/StatesData.geojson',
    color: '#a6a6c8',
    weight: 1.25,
    fillOpacity: 0,
    drawFunc: getStatesLayer,
  },

// ****************************************************
  {
    id: 'roads_highway',
    srcFile: '/geojson/roads_highway.geojson',
    weight: 1.35,
    color: '#5a5a5a',
    minZoom: 2,
    drawFunc: getRoutesLayer,
  },
  {
    id: 'roads_major',
    srcFile: '/geojson/roads_major.geojson',
    weight: 1.15,
    color: '#5a5a5a',
    minZoom: 3,
    drawFunc: getRoutesLayer,
  },
  {
    id: 'roads_minor',
    srcFile: '/geojson/roads_minor.geojson',
    weight: 1.0,
    color: '#5a5a5a',
    minZoom: 5,
    drawFunc: getRoutesLayer,
  },

  {
    id: 'streets_major',
    srcFile: '/geojson/streets_major.geojson',
    weight: 1.5,
    color: '#b9c8d6',
    minZoom: 10,
    drawFunc: getStreetsLayer,
  },
  {
    id: 'streets_minor',
    srcFile: '/geojson/streets_minor.geojson',
    weight: 1.25,
    color: '#b9c8d6',
    minZoom: 12,
    drawFunc: getStreetsLayer,
  },
  {
    id: 'alleys',
    srcFile: '/geojson/alleys.geojson',
    weight: 1.0,
    color: '#b9c8d6',
    minZoom: 14,
    drawFunc: getStreetsLayer,
  },

  {
    id: 'seaways',
    srcFile: '/geojson/seaways.geojson',
    minZoom: 5,
    drawFunc: getSeawayLayer,
  },
  {
    id: 'railways',
    srcFile: '/geojson/railways.geojson',
    weight: 1.15,
    color: '#5a5a5a',
    minZoom: 5,
    drawFunc: getRailwayLayer,
  },

  {
    id: 'buildings_major',
    srcFile: '/geojson/buildings_major.geojson',
    weight: 1.15,
    color: '#e8e9ed',
    minZoom: 15,
    drawFunc: getBuildingsLayer,
  },

    {
        id: 'parks',
        srcFile: '/geojson/parks.geojson',
        weight: 1.15,
        color: '#00DD00',
        minZoom: 15,
        drawFunc: getParksLayer,
    },

  {
    id: 'settlements_points',
    srcFile: '/geojson/settlements_points.geojson',
    weight: 1.15,
    color: '#5a5a5a',
    drawFunc: getSettlementPointsLayer,
    popupFunc: getSettlementPointsPopup,
    minZoom: 3,
  },

/************************************************/
  
  {
    id: 'water_labels',
    srcFile: '/geojson/water_labels.geojson',
    weight: 1.15,
    color: '#5a5a5a',
    drawFunc: getLabelsLayer,
  },
  {
    id: 'landform_labels',
    srcFile: '/geojson/landform_labels.geojson',
    weight: 1.15,
    color: '#5a5a5a',
    drawFunc: getLabelsLayer,
  },
  // {
  //   id: 'lore_labels',
  //   srcFile: '/geojson/lore_labels.geojson',
  //   weight: 1.15,
  //   color: '#5a5a5a',
  //   drawFunc: getLabelsLayer,
  // },
  {
    id: 'political_line_labels',
    srcFile: '/geojson/political_line_labels.geojson',
    weight: 1.15,
    color: '#5a5a5a',
    drawFunc: getLabelsLayer,
  },
  {
    id: 'route_labels',
    srcFile: '/geojson/route_labels.geojson',
    weight: 1.15,
    color: '#5a5a5a',
    drawFunc: getLabelsLayer,
  },

/************************************************/  
]

const LAND_LAYER_FILE = '/geojson/land.geojson'
const BIOMES_LAYER_FILE = '/geojson/BiomesData.geojson'

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

type MapViewState =
{
  zoom: number
  center: [number, number]
}

type BaseLayerKey = 'land' | 'biomes'

const LAYER_QUERY_PARAM = 'layer'

function parseBaseLayerFromUrl(): BaseLayerKey | null
{
  const searchParams = new URLSearchParams(window.location.search)
  const rawLayer = searchParams.get(LAYER_QUERY_PARAM)

  if (!rawLayer)
  {
    return null
  }

  const normalizedLayer = rawLayer.toLowerCase()

  if (normalizedLayer === 'land')
  {
    return 'land'
  }

  if (normalizedLayer === 'biomes')
  {
    return 'biomes'
  }

  return null
}

function parseMapViewFromUrl(defaultCenter: [number, number], defaultZoom: number, minZoom: number, maxZoom: number): MapViewState
{
  const searchParams = new URLSearchParams(window.location.search)
  const rawLat = searchParams.get('lat')
  const rawLng = searchParams.get('lng')
  const rawZoom = searchParams.get('z')

  let centerLat = defaultCenter[0]
  let centerLng = defaultCenter[1]
  let zoom = defaultZoom

  if (rawLat !== null)
  {
    const parsedLat = Number(rawLat)

    if (Number.isFinite(parsedLat))
    {
      centerLat = Math.max(-90, Math.min(90, parsedLat))
    }
  }

  if (rawLng !== null)
  {
    const parsedLng = Number(rawLng)

    if (Number.isFinite(parsedLng))
    {
      centerLng = Math.max(-180, Math.min(180, parsedLng))
    }
  }

  if (rawZoom !== null)
  {
    const parsedZoom = Number(rawZoom)

    if (Number.isFinite(parsedZoom))
    {
      const roundedZoom = Math.round(parsedZoom)
      zoom = Math.max(minZoom, Math.min(maxZoom, roundedZoom))
    }
  }

  return {
    zoom,
    center: [centerLat, centerLng],
  }
}

function hasMapViewParamsInUrl(): boolean
{
  const searchParams = new URLSearchParams(window.location.search)
  const hasLatParam = searchParams.has('lat')
  const hasLngParam = searchParams.has('lng')
  const hasZoomParam = searchParams.has('z')

  if (hasLatParam || hasLngParam || hasZoomParam)
  {
    return true
  }

  return false
}

const DebugTracker = ({ onViewChange }: { onViewChange: (view: MapViewState) => void }) =>
{
  useMapEvents({
    zoomend: (e) =>
    {
      const zoom = e.target.getZoom()
      const c = e.target.getCenter()
      onViewChange({
        zoom,
        center: [c.lat, c.lng],
      })
    },
    moveend: (e) =>
    {
      const zoom = e.target.getZoom()
      const c = e.target.getCenter()
      onViewChange({
        zoom,
        center: [c.lat, c.lng],
      })
    },
  })
  return null
}

const EnsureMapPanes = () =>
{
  const map = useMap()

  useEffect(() =>
  {
    let pane = map.getPane(BASE_GEOJSON_PANE)

    if (!pane)
    {
      pane = map.createPane(BASE_GEOJSON_PANE)
    }

    pane.style.zIndex = BASE_GEOJSON_Z_INDEX
  }, [map])

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
  const [shouldFitBounds] = useState(() => !hasMapViewParamsInUrl())
  const [initialView] = useState<MapViewState>(() =>
  {
    return parseMapViewFromUrl(initialCenter, initialZoom, minZoom, maxZoom)
  })
  const [entries, setEntries] = useState<GeoJsonEntry[]>([])
  const [loadError, setLoadError] = useState('')
  const [isEarthLayerVisible, setIsEarthLayerVisible] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(initialView.zoom)
  const [coords, setCoords] = useState<[number, number]>(initialView.center)
  const [copyMessage, setCopyMessage] = useState('')
  const [selectedBaseLayer, setSelectedBaseLayer] = useState<BaseLayerKey>(() =>
  {
    const parsedBaseLayer = parseBaseLayerFromUrl()

    if (parsedBaseLayer)
    {
      return parsedBaseLayer
    }

    return DEFAULT_MAP_LAYER
  })

  const syncViewToUrl = (view: MapViewState, baseLayer: BaseLayerKey) =>
  {
    const url = new URL(window.location.href)
    const nextLat = view.center[0].toFixed(4)
    const nextLng = view.center[1].toFixed(4)
    const nextZoom = String(view.zoom)

    url.searchParams.set('lat', nextLat)
    url.searchParams.set('lng', nextLng)
    url.searchParams.set('z', nextZoom)
    url.searchParams.set(LAYER_QUERY_PARAM, baseLayer)

    const nextUrl = `${url.pathname}?${url.searchParams.toString()}${url.hash}`
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (nextUrl !== currentUrl)
    {
      window.history.replaceState(null, '', nextUrl)
    }
  }

  const handleMapViewChange = (view: MapViewState) =>
  {
    setCurrentZoom(view.zoom)
    setCoords(view.center)
    syncViewToUrl(view, selectedBaseLayer)
  }

  const handleBaseLayerChange = (nextLayer: BaseLayerKey) =>
  {
    setSelectedBaseLayer(nextLayer)
    syncViewToUrl({
      zoom: currentZoom,
      center: coords,
    }, nextLayer)
  }

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
      <ImageOverlay url={EARTH_LAYER_FILE} bounds={EARTH_LAYER_BOUNDS} opacity={0.25} />
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

  let earthLayerControlElement = null

  if (fullScreen)
  {
    earthLayerControlElement = (
      <div className="leaflet-top leaflet-left" style={{ marginTop: '70px', marginLeft: '0px' }}>
        <div className="leaflet-control leaflet-bar">
          <button
            className="numbered-button"
            type="button"
            onClick={toggleEarthLayer}
            title={earthLayerTitle}
            aria-label="Toggle Earth layer"
            aria-pressed={isEarthLayerVisible}
            style={{
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              borderRadius: 0,
              padding: 0,
            }}
          >
            🌎
          </button>
        </div>
      </div>
    )
  }

  const renderEntryLayer = (entry: GeoJsonEntry) =>
  {
    const entryMinZoom = entry.options.minZoom ?? 0
    const entryMaxZoom = entry.options.maxZoom ?? Number.POSITIVE_INFINITY

    if (currentZoom < entryMinZoom || currentZoom > entryMaxZoom)
    {
      return null
    }

    if (entry.options.drawFunc)
    {
      return entry.options.drawFunc(entry)
    }

    return (
      <GeoJSON
        key={entry.id}
        data={entry.data}
        pane={entry.options.pane}
        style={() =>
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
  }

  let landEntry: GeoJsonEntry | null = null
  let biomesEntry: GeoJsonEntry | null = null
  const otherEntries: GeoJsonEntry[] = []

  for (const entry of entries)
  {
    if (entry.id === LAND_LAYER_FILE)
    {
      landEntry = entry
    }
    else if (entry.id === BIOMES_LAYER_FILE)
    {
      biomesEntry = entry
    }
    else
    {
      otherEntries.push(entry)
    }
  }

  let baseLayerElement = null

  if (landEntry || biomesEntry)
  {
    let activeBaseLayer: BaseLayerKey = selectedBaseLayer

    if (activeBaseLayer === 'land' && !landEntry && biomesEntry)
    {
      activeBaseLayer = 'biomes'
    }

    if (activeBaseLayer === 'biomes' && !biomesEntry && landEntry)
    {
      activeBaseLayer = 'land'
    }

    if (activeBaseLayer === 'land' && landEntry)
    {
      baseLayerElement = renderEntryLayer(landEntry)
    }
    else if (activeBaseLayer === 'biomes' && biomesEntry)
    {
      baseLayerElement = renderEntryLayer(biomesEntry)
    }
  }

  const boundsFitterElement = fullScreen && shouldFitBounds ? <GeoJsonBoundsFitter entries={entries} /> : null

  return (
    <div className="map-fullscreen-container">
      <div className="map-main">
        <MapContainer
          key={`geojson-map-${initialView.center[0]}-${initialView.center[1]}-${initialView.zoom}-${minZoom}-${maxZoom}`}
          center={initialView.center}
          zoom={initialView.zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          scrollWheelZoom={scrollWheelZoom}
          style={{ height: '100%', width: '100%', backgroundColor: '#7bd5e9' }}
          attributionControl={false}
          crs={L.CRS.EPSG4326}
        >
          <ScaleControl
            position="bottomleft"
            metric={true}
            imperial={true}
            maxWidth={180}
            updateWhenIdle={true}
          />
          <EnsureMapPanes />
          {earthLayerElement}
          {baseLayerElement}
          {otherEntries.map((entry) =>
          {
            return (
              <LayerGroup key={entry.id}>
                {renderEntryLayer(entry)}
              </LayerGroup>
            )
          })}
          {boundsFitterElement}
          <DebugTracker onViewChange={handleMapViewChange} />
          {fullScreenLinkElement}
          {earthLayerControlElement}
        </MapContainer>
        {fullScreen && <MapRightPanel selectedBaseLayer={selectedBaseLayer} onBaseLayerChange={handleBaseLayerChange} />}
        {renderDebug()}
        {loadError ? <div className="geojson-error-banner">{loadError}</div> : null}
      </div>
    </div>
  )
}

export default GeoJsonFullScreen
