import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { GeoJSON, ImageOverlay, LayerGroup, MapContainer, Marker, Polyline, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import MapRightPanel from './MapRightPanel'
import L from 'leaflet'
import { getBiomesLayer } from './layers/Biomes'
import { getHeightLayer } from './layers/HeightLayer'
// import { getTownLayer } from './layers/TownLayer'
import { getSettlementPointsLayer } from './layers/SettlmentPoints'
import { getStatesLayer, getStatesColorsLayer } from './layers/States'
import { getRailwayLayer } from './layers/RailwayLayer'
import { getSeawayLayer } from './layers/SeawayLayer'
import { getStreetsLayer, STREET_OUTLINE_PANE, STREET_CENTER_PANE, STREET_LABEL_PANE } from './layers/StreetsLayer'
// import { getRoutesLayer } from './layers/Routes'
import { getLabelsLayer } from './layers/LabelsLayer'
import { getBuildingsLayer } from './layers/BuildingsLayer'
import { getParksLayer } from './layers/ParksLayer'
import { getSettlementPointsPopup } from './layers/SettlementPointsPopup.tsx'
import 'leaflet/dist/leaflet.css'
import './ScaleControl.css'
import './MapFullScreen.css'

const MIN_ZOOM = 2
const MAX_ZOOM = 20
const ZOOM_SNAP = 0.1
const ZOOM_DELTA = 0.1
const WHEEL_PX_PER_ZOOM_LEVEL = 5
const DEFAULT_CENTER: [number, number] = [0, 0]
const DEFAULT_MAP_LAYER = 'states'

type GeoJsonLayerOptions =
{
    id?: string
    label?: string
    srcFile: string
    baseLayer?: boolean
    pane?: string
    color?: string
    fillColor?: string
    weight?: number
    fillOpacity?: number
    minZoom?: number
    maxZoom?: number
    drawFunc?: (entry: GeoJsonEntry) => ReactNode
    popupFunc?: (feature: GeoJSON.Feature, entry: GeoJsonEntry) => string
    _renderPhase?: 'outline' | 'center' | 'both'
    toggleable?: boolean,
    visible?: boolean,
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
const STREET_OUTLINE_PANE_Z_INDEX = '401'
const STREET_CENTER_PANE_Z_INDEX = '402'
const STREET_LABEL_PANE_Z_INDEX = '650'

// Add your GeoJSON file URLs here (must be publicly served paths, usually from /public).
const GEOJSON_FILES : GeoJsonLayerOptions[] = 
[
    {
        id: 'land',
        srcFile: '/geojson/land.geojson',
        // baseLayer: true,
        pane: BASE_GEOJSON_PANE,
        color: '#7bd5e9',
        fillColor: '#ffffff',
        weight: 1,
        fillOpacity: 1,
    },
    {
        id: 'biomes',
        label: 'Biomes',
        srcFile: '/geojson/BiomesData.geojson',
        baseLayer: true,
        pane: BASE_GEOJSON_PANE,
        color: '#7bd5e9',
        fillColor: '#ffffff',
        weight: 1,
        fillOpacity: .75,
        drawFunc: getBiomesLayer,
    },
    {
        id: 'height',
        label: 'Height',
        srcFile: '/geojson/height.geojson',
        baseLayer: true,
        pane: BASE_GEOJSON_PANE,
        color: '#a6a6c8',
        fillColor: '#ffffff',
        weight: 0.5,
        fillOpacity: .75,
        drawFunc: getHeightLayer,
    },
    {
        id: 'states',
        label: 'Borders Only',
        srcFile: '/geojson/StatesData.geojson',
        color: '#a6a6c8',
        weight: 1.26,
        fillOpacity: 0,
        baseLayer: true,
        pane: BASE_GEOJSON_PANE,
        drawFunc: getStatesLayer,
    },
    {
        id: 'states-color',
        label: 'Political Map',
        srcFile: '/geojson/StatesData.geojson',
        color: '#a6a6c8',
        weight: 1.26,
        fillOpacity: 0,
        baseLayer: true,
        pane: BASE_GEOJSON_PANE,
        drawFunc: getStatesColorsLayer,
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

    // ****************************************************
    {
        // major roads spanning large regions and connecting major settlements, often highways 
        // or primary routes
        // real world examples: I95 east coast USA, 495 in the Washington DC area
        id: 'roads_highway',
        srcFile: '/geojson/roads_highway.geojson',
        weight: 1.5,
        color: '#ffb47f',
        minZoom: 4,
        drawFunc: getStreetsLayer,
    },
    {
        // major roads that are important but not highways, such as long country roads
        // connecting minor settlements or serving as main roads within larger regions
        // real world examples: US Route 50, Rt 15 north of Frederick MD
        id: 'roads_major',
        srcFile: '/geojson/roads_major.geojson',
        weight: 1.25,
        color: '#ffb47f',
        minZoom: 4,
        drawFunc: getStreetsLayer,
    },
    {
        // minor roads connecting smaller towns but are not main routes
        // real world examples: route 77 in Maryland connecting Thurmont and Westminster
        id: 'roads_minor',
        srcFile: '/geojson/roads_minor.geojson',
        weight: 1.0,
        color: '#5a5a5a',
        minZoom: 4,
        drawFunc: getStreetsLayer,
    },
    {
        id: 'streets_major',
        srcFile: '/geojson/streets_major.geojson',
        weight: 1.5,
        color: '#b9c8d6',
        minZoom: 7,
        drawFunc: getStreetsLayer,
    },
    {
        id: 'streets_minor',
        srcFile: '/geojson/streets_minor.geojson',
        weight: 1.25,
        color: '#b9c8d6',
        minZoom: 7,
        drawFunc: getStreetsLayer,
    },
    {
        id: 'alleys',
        srcFile: '/geojson/alleys.geojson',
        weight: 1.0,
        color: '#b9c8d6',
        minZoom: 10,
        drawFunc: getStreetsLayer,
    },

    {
        id: 'seaways',
        srcFile: '/geojson/seaways.geojson',
        minZoom: 7,
        drawFunc: getSeawayLayer,
    },
    {
        id: 'railways',
        srcFile: '/geojson/railways.geojson',
        weight: 1.15,
        color: '#5a5a5a',
        minZoom: 7,
        drawFunc: getRailwayLayer,
    },

    {
        id: 'buildings_major',
        srcFile: '/geojson/buildings_major.geojson',
        weight: 0.25,
        color: '#000',
        fillColor: '#e8e9ed',
        minZoom: 10,
        drawFunc: getBuildingsLayer,
    },

    {
        id: 'parks',
        srcFile: '/geojson/parks.geojson',
        weight: 1.15,
        color: '#a7d9b4',
        minZoom: 7,
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
    // {
    //   id: 'route_labels',
    //   srcFile: '/geojson/route_labels.geojson',
    //   weight: 1.15,
    //   color: '#5a5a5a',
    //   drawFunc: getLabelsLayer,
    // },

    /************************************************/
]

type ToggleGroup = 
{
    id: string;
    label: string;
    visible: boolean;
    layerIds: readonly string[];
};

const TOGGLE_GROUPS: ToggleGroup[] = [
    {
        id: 'streets',
        label: 'Streets',
        visible: true,
        layerIds: [
            'roads_highway',
            'roads_major',
            'roads_minor',
            'streets_major',
            'streets_minor',
            'alleys',
        ],
    },
    {
        id: 'railways',
        label: 'Railways',
        visible: true,
        layerIds: [
            'railways',
        ],
    },
    {
        id: 'seaways',
        label: 'Seaways',
        visible: true,
        layerIds: [
            'seaways',
        ],
    },
    {
        id: 'country_labels',
        label: 'Countries',
        visible: true,
        layerIds: [
            'political_line_labels',
        ],
    },
    {
        id: 'city_labels',
        label: 'Cities',
        visible: true,
        layerIds: [
            'settlements_points',
        ],
    },
    {
        id: 'water_labels',
        label: 'Water',
        visible: true,
        layerIds: [
            'water_labels',
        ],
    },
    {
        id: 'structures',
        label: 'Structures',
        visible: true,
        layerIds: [
            'buildings_major',
            'parks',
        ],
    }
];

type ToogleGroupContainer = 
{
    id: string;
    label: string;
    groupIds: readonly string[];
}

const TOGGLE_GROUP_CONTAINERS: ToogleGroupContainer[] = [
    {
        id: 'transit',
        label: 'Transit',
        groupIds: [
            'streets',
            'railways',
            'seaways',
        ]
    },
    {
        id: 'labels',
        label: 'Labels',
        groupIds: [
            'city_labels',
            'country_labels',
            'structures',
            'water_labels',
        ]
    },

]

type LayerOption =
{
    id: string
    label: string
}

function getGeoJsonLayerId(options: GeoJsonLayerOptions): string
{
    if (options.id)
    {
        return options.id
    }

    return options.srcFile
}

function formatLayerLabel(layerId: string): string
{
    const normalizedName = layerId.split('/').pop() ?? layerId
    const labelText = normalizedName.replace(/[_-]+/g, ' ')

    return labelText.charAt(0).toUpperCase() + labelText.slice(1)
}

function getBaseLayerOptions(layers: GeoJsonLayerOptions[]): LayerOption[]
{
    return layers
        .filter((layer) => layer.baseLayer)
        .map((layer) =>
        {
            const id = getGeoJsonLayerId(layer)
            const label = layer.label ?? id

            return {
                id,
                label: formatLayerLabel(label),
            }
        })
}

function getInitialBaseLayer(baseLayers: LayerOption[]): string
{
    const baseLayerIds = baseLayers.map((layer) => layer.id)

    if (baseLayerIds.includes(DEFAULT_MAP_LAYER))
    {
        return DEFAULT_MAP_LAYER
    }

    if (baseLayerIds.length > 0)
    {
        return baseLayerIds[0]
    }

    return DEFAULT_MAP_LAYER
}

function parseBaseLayerFromUrl(baseLayers: LayerOption[]): string | null
{
    const searchParams = new URLSearchParams(window.location.search)
    const rawLayer = searchParams.get(LAYER_QUERY_PARAM)

    if (!rawLayer)
    {
        return null
    }

    const normalizedLayer = rawLayer.toLowerCase()
    const allowedLayerIds = new Set(baseLayers.map((layer) => layer.id.toLowerCase()))

    if (allowedLayerIds.has(normalizedLayer))
    {
        return normalizedLayer
    }

    return null
}

function hasBaseLayerInUrl(baseLayers: LayerOption[]): boolean
{
    return parseBaseLayerFromUrl(baseLayers) !== null
}

const BASE_LAYER_OPTIONS = getBaseLayerOptions(GEOJSON_FILES)

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

type MeasurePoint = [number, number]

const LAYER_QUERY_PARAM = 'layer'

const MEASURE_POINT_ICON = L.divIcon({
    className: 'measure-point-marker',
    html: '<span class="measure-point-marker-dot"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
})

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
            zoom = Math.max(minZoom, Math.min(maxZoom, parsedZoom))
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

const DebugTracker = (
    {
        onViewChange,
        onMapClick,
    }:
    {
        onViewChange: (view: MapViewState) => void
        onMapClick?: (point: MeasurePoint) => void
    }
) =>
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
        click: (event) =>
        {
            if (!onMapClick)
            {
                return
            }

            onMapClick([event.latlng.lat, event.latlng.lng])
        },
    })
    return null
}

const EnsureMapPanes = () =>
{
    const map = useMap()

    useEffect(() =>
    {
        let basePane = map.getPane(BASE_GEOJSON_PANE)

        if (!basePane)
        {
            basePane = map.createPane(BASE_GEOJSON_PANE)
        }

        basePane.style.zIndex = BASE_GEOJSON_Z_INDEX

        let streetOutlinePane = map.getPane(STREET_OUTLINE_PANE)

        if (!streetOutlinePane)
        {
            streetOutlinePane = map.createPane(STREET_OUTLINE_PANE)
        }

        streetOutlinePane.style.zIndex = STREET_OUTLINE_PANE_Z_INDEX

        let streetCenterPane = map.getPane(STREET_CENTER_PANE)

        if (!streetCenterPane)
        {
            streetCenterPane = map.createPane(STREET_CENTER_PANE)
        }

        streetCenterPane.style.zIndex = STREET_CENTER_PANE_Z_INDEX

        let streetLabelPane = map.getPane(STREET_LABEL_PANE)

        if (!streetLabelPane)
        {
            streetLabelPane = map.createPane(STREET_LABEL_PANE)
        }

        streetLabelPane.style.zIndex = STREET_LABEL_PANE_Z_INDEX
    }, [map])

    return null
}

const RecenterControl = ({ cachedView }: { cachedView: MapViewState }) =>
{
    const map = useMap()

    const handleRecenterClick = () =>
    {
        map.setView(cachedView.center, cachedView.zoom)
    }

    return (
        <div className="leaflet-top leaflet-left" style={{ marginTop: '70px', marginLeft: '0px' }}>
            <div className="leaflet-control leaflet-bar">
                <button
                    className="numbered-button"
                    type="button"
                    onClick={handleRecenterClick}
                    title="Recenter map"
                    aria-label="Recenter map"
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
                    ⌖
                </button>
            </div>
        </div>
    )
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

function findSelectedBaseLayerEntry(entries: GeoJsonEntry[], selectedBaseLayer: string): GeoJsonEntry | null
{
    for (const entry of entries)
    {
        if (!entry.options.baseLayer)
        {
            continue
        }

        if (getGeoJsonLayerId(entry.options) === selectedBaseLayer)
        {
            return entry
        }
    }

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
    const [toggleGroups, setToggleGroups] = useState<ToggleGroup[]>(TOGGLE_GROUPS)
    const [shouldFitBounds] = useState(() => !hasMapViewParamsInUrl())
    const [initialView] = useState<MapViewState>(() =>
    {
        return parseMapViewFromUrl(initialCenter, initialZoom, minZoom, maxZoom)
    })

    const [cachedInitialView] = useState<MapViewState>(() =>
    {
        return {
            zoom: initialView.zoom,
            center: [initialView.center[0], initialView.center[1]],
        }
    })
    
    const [entries, setEntries] = useState<GeoJsonEntry[]>([])
    const [loadError, setLoadError] = useState('')
    const [isEarthLayerVisible, setIsEarthLayerVisible] = useState(false)
    const [currentZoom, setCurrentZoom] = useState(initialView.zoom)
    const [coords, setCoords] = useState<[number, number]>(initialView.center)
    const [copyMessage, setCopyMessage] = useState('')
    const [isMeasureMode, setIsMeasureMode] = useState(false)
    const [measurePoints, setMeasurePoints] = useState<MeasurePoint[]>([])
    
    const [selectedBaseLayer, setSelectedBaseLayer] = useState<string>(() =>
    {
        const parsedBaseLayer = parseBaseLayerFromUrl(BASE_LAYER_OPTIONS)

        if (parsedBaseLayer)
        {
            return parsedBaseLayer
        }

        return getInitialBaseLayer(BASE_LAYER_OPTIONS)
    })

    useEffect(() =>
    {
        if (hasBaseLayerInUrl(BASE_LAYER_OPTIONS))
        {
            return
        }

        syncViewToUrl(initialView, selectedBaseLayer)
    }, [initialView, selectedBaseLayer])

    const syncViewToUrl = (view: MapViewState, baseLayer: string) =>
    {
        if (!fullScreen)
        {
            return
        }

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

    const handleBaseLayerChange = (nextLayer: string) =>
    {
        setSelectedBaseLayer(nextLayer)
        syncViewToUrl({
            zoom: currentZoom,
            center: coords,
        }, nextLayer)
    }

    const handleOptionalLayerChange = (layerId: string, isChecked: boolean) =>
    {
        console.log(`Layer toggle change: ${layerId} is now ${isChecked ? 'ON' : 'OFF'}`)
   
        const temporaryGroups: typeof toggleGroups = [];

        for (let i = 0; i < toggleGroups.length; i++) 
        {
            const currentGroup = toggleGroups[i];

            if (currentGroup.id === layerId) 
            {
                // Create a temporary object for the modified group
                const updatedGroup = 
                {
                    ...currentGroup,
                    visible: isChecked
                };

                for (const layerId of currentGroup.layerIds)
                {
                    const layerEntry = entries.find((entry) => getGeoJsonLayerId(entry.options) === layerId)
                    console.log(`Setting layer ${layerId} visibility to ${isChecked ? 'ON' : 'OFF'}`)
                    if (layerEntry) 
                    {
                        layerEntry.options.visible = isChecked;
                    }
                }
                
                // Push the modified group into our temporary array
                temporaryGroups.push(updatedGroup);
            } 
            else 
            {
                // Push the untouched group into our temporary array
                temporaryGroups.push(currentGroup);
            }
        }

        setToggleGroups(temporaryGroups);
    }

    const navigateTo = (path: string) =>
    {
        window.location.assign(path)
    }

    const toggleMeasureMode = () =>
    {
        if (isMeasureMode)
        {
            setIsMeasureMode(false)
            return
        }

        setIsMeasureMode(true)
    }

    const clearMeasurements = () =>
    {
        setMeasurePoints([])
    }

    const handleMeasureMapClick = (point: MeasurePoint) =>
    {
        if (!isMeasureMode)
        {
            return
        }

        setMeasurePoints((previousPoints) =>
        {
            return [...previousPoints, point]
        })
    }

    const getTotalMeasuredDistanceKm = () =>
    {
        if (measurePoints.length < 2)
        {
            return 0
        }

        let totalDistanceMeters = 0

        for (let index = 1; index < measurePoints.length; index++)
        {
            const previousPoint = measurePoints[index - 1]
            const currentPoint = measurePoints[index]
            const previousLatLng = L.latLng(previousPoint[0], previousPoint[1])
            const currentLatLng = L.latLng(currentPoint[0], currentPoint[1])

            totalDistanceMeters += previousLatLng.distanceTo(currentLatLng)
        }

        return totalDistanceMeters / 1000
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
            const loadedEntries = await Promise.all(
                GEOJSON_FILES.map(async (filePath) =>
                {
                    const response = await fetch(filePath.srcFile)

                    if (!response.ok)
                    {
                        throw new Error(`Unable to load ${filePath.srcFile} (${response.status})`)
                    }

                    const payload = (await response.json()) as GeoJSON.GeoJsonObject

                    return {
                        id: getGeoJsonLayerId(filePath),
                        data: payload,
                        options: { ...filePath },
                    }
                })
            )

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

    const renderMeasurementLayers = () =>
    {
        if (measurePoints.length === 0)
        {
            return null
        }

        return (
            <>
                <Polyline positions={measurePoints} pathOptions={{ color: '#0C66E4', weight: 3 }} />
                {measurePoints.map((point, index) =>
                {
                    const dragHandlers = {
                        drag: (event: L.LeafletEvent) =>
                        {
                            const target = event.target as L.Marker
                            const nextLatLng = target.getLatLng()

                            setMeasurePoints((previousPoints) =>
                            {
                                return previousPoints.map((existingPoint, existingIndex) =>
                                {
                                    if (existingIndex !== index)
                                    {
                                        return existingPoint
                                    }

                                    return [nextLatLng.lat, nextLatLng.lng]
                                })
                            })
                        },
                    }

                    return (
                        <Marker
                            key={`measure-point-${index}`}
                            position={point}
                            draggable={isMeasureMode}
                            icon={MEASURE_POINT_ICON}
                            eventHandlers={dragHandlers}
                        />
                    )
                })}
            </>
        )
    }

    const renderMeasureIndicator = () =>
    {
        if (!isMeasureMode)
        {
            return null
        }

        const totalDistanceKm = getTotalMeasuredDistanceKm()

        if (totalDistanceKm <= 0)
        {
            return null
        }

        const totalDistanceMiles = totalDistanceKm * 0.621371

        return (
            <div className="measure-indicator">
                {totalDistanceMiles.toFixed(2)} mi ({totalDistanceKm.toFixed(2)} km)
            </div>
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
    let recenterControlElement = null

    if (fullScreen)
    {
        recenterControlElement = <RecenterControl cachedView={cachedInitialView} />
    }

    if (fullScreen)
    {
        earthLayerControlElement = (
            <div className="leaflet-top leaflet-left" style={{ marginTop: '108px', marginLeft: '0px' }}>
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

    let measureControlElement = null

    if (fullScreen)
    {
        const measureButtonStyle =
        {
            width: '30px',
            height: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            borderRadius: 0,
            padding: 0,
            backgroundColor: isMeasureMode ? '#e7f0ff' : '#ffffff',
        }

        measureControlElement = (
            <div className="leaflet-top leaflet-left" style={{ marginTop: '146px', marginLeft: '0px' }}>
                <div className="leaflet-control leaflet-bar">
                    <button
                        type="button"
                        onClick={toggleMeasureMode}
                        onMouseDown={(event) => event.stopPropagation()}
                        title={isMeasureMode ? 'Turn off measure mode' : 'Turn on measure mode'}
                        aria-label="Toggle measure mode"
                        aria-pressed={isMeasureMode}
                        style={measureButtonStyle}
                    >
                        📏
                    </button>
                    <button
                        type="button"
                        onClick={clearMeasurements}
                        onMouseDown={(event) => event.stopPropagation()}
                        title="Clear measured points"
                        aria-label="Clear measured points"
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
                            borderTop: '1px solid #ccc',
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>
        )
    }

    const renderEntryLayer = (entry: GeoJsonEntry) =>
    {
        if (entry.options.visible === false)
        {
            return null
        }

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

    const baseLayerEntry = findSelectedBaseLayerEntry(entries, selectedBaseLayer)
    const otherEntries = entries.filter((entry) => !entry.options.baseLayer)
    const baseLayerElement = baseLayerEntry ? renderEntryLayer(baseLayerEntry) : null

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
                    zoomSnap={ZOOM_SNAP}
                    zoomDelta={ZOOM_DELTA}
                    wheelPxPerZoomLevel={WHEEL_PX_PER_ZOOM_LEVEL}
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
                    {renderMeasurementLayers()}
                    
                    {/* Render all road layer outlines first */}
                    {otherEntries
                        .filter((entry) => (entry.options.visible == null || entry.options.visible === true))
                        .filter((entry) => entry.options.drawFunc === getStreetsLayer)
                        .map((entry) => (
                            <LayerGroup key={`${entry.id}-outline-phase`}>
                                {renderEntryLayer({ ...entry, options: { ...entry.options, _renderPhase: 'outline' as const } })}
                            </LayerGroup>
                        ))}
                    
                    {/* Render all non-road entries */}
                    {otherEntries
                        .filter((entry) => (entry.options.visible == null || entry.options.visible === true))
                        .filter((entry) => entry.options.drawFunc !== getStreetsLayer)
                        .map((entry) => (
                            <LayerGroup key={entry.id}>
                                {renderEntryLayer(entry)}
                            </LayerGroup>
                        ))}
                    
                    {/* Render all road layer centers last */}
                    {otherEntries
                        .filter((entry) => (entry.options.visible == null || entry.options.visible === true))
                        .filter((entry) => entry.options.drawFunc === getStreetsLayer)
                        .map((entry) => (
                            <LayerGroup key={`${entry.id}-center-phase`}>
                                {renderEntryLayer({ ...entry, options: { ...entry.options, _renderPhase: 'center' as const } })}
                            </LayerGroup>
                        ))}
                    {boundsFitterElement}
                    <DebugTracker onViewChange={handleMapViewChange} onMapClick={handleMeasureMapClick} />
                    {fullScreenLinkElement}
                    {recenterControlElement}
                    {earthLayerControlElement}
                    {measureControlElement}
                </MapContainer>
                {fullScreen && <MapRightPanel 
                    baseLayers={BASE_LAYER_OPTIONS} selectedBaseLayer={selectedBaseLayer} onBaseLayerChange={handleBaseLayerChange} 
                    optionalLayers={toggleGroups} onOptionalLayerChange={handleOptionalLayerChange}
                    toggleGroupContainers={TOGGLE_GROUP_CONTAINERS}
                    />}
                {renderMeasureIndicator()}
                {renderDebug()}
                {loadError ? <div className="geojson-error-banner">{loadError}</div> : null}
            </div>
        </div>
    )
}

export default GeoJsonFullScreen
