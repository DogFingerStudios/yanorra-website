import { GeoJSON, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import './SettlmentPoints.css'

const POPUP_MODE: 'click' | 'hover' = 'hover'

type SettlementPointsLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options?:
  {
    popupFunc?: (feature: GeoJSON.Feature, entry: any) => string
  }
}

export function getSettlementPointsLayer(entry: SettlementPointsLayerEntry)
{
  return <SettlementPointsLayer entry={entry} />
}

function getTownPopulation(properties: GeoJSON.GeoJsonProperties): number | null
{
  const population = properties?.population
  if (typeof population === 'number' && Number.isFinite(population))
  {
    return population
  }

  if (typeof population === 'string')
  {
    const parsedPopulation = Number(population)

    if (Number.isFinite(parsedPopulation))
    {
      return parsedPopulation
    }
  }

  return null
}

function shouldShowTown(properties: GeoJSON.GeoJsonProperties, zoom: number): boolean
{
  const maxZoom = properties?.max_zoom;
  const minZoom = properties?.min_zoom;

  // print out the burg name, the population, the max zoom, min zoom, and the current zoom
  // const burgName = properties?.Burg ?? 'Unknown'
  // const population2 = getTownPopulation(properties) ?? 'Unknown'
  // console.log(`Burg: ${burgName}, Population: ${population2}, MaxZoom: ${maxZoom}, MinZoom: ${minZoom}, Current Zoom: ${zoom}`)

  // When the data has an explicit zoom window, respect it for the upper range (zoomed in
  // detail view). Below min_zoom, fall through to population-based logic so major cities
  // still appear when zoomed out.
  if (typeof maxZoom === 'number' && zoom > maxZoom)
  {
    return false
  }

  if (typeof minZoom === 'number' && zoom >= minZoom)
  {
    return true
  }

  const population = getTownPopulation(properties)
  // console.log("The population for this town is:", population);
  if (population === null)
  {
    return true
  }

  switch (zoom)
  {
    case 0:
    case 1:
    case 2:
      return population >= 250_000
    case 3:
    case 4:
    case 5:
      return population >= 100_000
    case 6:
      return population >= 5_000
    case 7:
    case 8:
    case 9:
      return population >= 1_000
    case 10:
    case 11:
    case 12:
      return population >= 500
    default:
      return true
  }

  return true;
}

function onEachFeatureHandler(feature: GeoJSON.Feature, layer: L.Layer, zoom: number, entry: SettlementPointsLayerEntry)
{
    const properties = feature.properties

    if (!properties)
    {
        return
    }

    const burgName = properties.name
    if (typeof burgName !== 'string' || burgName.trim() === '')
    {
        // console.log("Skipping feature with missing or invalid 'name' property:", properties)
        return
    }

    if (!shouldShowTown(properties, zoom))
    {
        return
    }

    const tooltipLayer = layer as L.Layer &
    {
        bindTooltip?: (content: string, options?: L.TooltipOptions) => L.Layer
    }

    if (typeof tooltipLayer.bindTooltip === 'function')
    {
        tooltipLayer.bindTooltip(burgName, {
        permanent: true,
        direction: 'top',
        // offset: L.point(0, -8),
        offset: L.point(0, 0),
        opacity: 0.9,
        className: 'settlement-point-label-tooltip',
        })
    }

    const popupContent = entry.options?.popupFunc?.(feature, entry)
    const popupLayer = layer as L.Layer &
    {
        bindPopup?: (content: string, options?: L.PopupOptions) => L.Layer
        openPopup?: () => L.Layer
        closePopup?: () => L.Layer
        on?: (event: string, handler: L.LeafletEventHandlerFn) => L.Layer
    }

    if (typeof popupContent !== 'string' || popupContent.trim() === '')
    {
        return
    }

    if (typeof popupLayer.bindPopup !== 'function')
    {
        return
    }

    const isClickMode = POPUP_MODE === 'click'

    popupLayer.bindPopup(popupContent, {
        closeButton: false,
        autoClose: isClickMode,
        closeOnClick: isClickMode,
    })

    if (POPUP_MODE !== 'hover')
    {
        return
    }

    if (typeof popupLayer.on !== 'function')
    {
        return
    }

    let isMarkerHovered = false
    let isPopupHovered = false
    let closeTimeoutId: number | null = null

    const clearCloseTimeout = () =>
    {
        if (closeTimeoutId !== null)
        {
        window.clearTimeout(closeTimeoutId)
        closeTimeoutId = null
        }
    }

    const scheduleClose = () =>
    {
        clearCloseTimeout()

        closeTimeoutId = window.setTimeout(() =>
        {
        if (!isMarkerHovered && !isPopupHovered)
        {
            if (typeof popupLayer.closePopup === 'function')
            {
            popupLayer.closePopup()
            }
        }
        }, 140)
    }

    popupLayer.on('mouseover', () =>
    {
        isMarkerHovered = true
        clearCloseTimeout()

        if (typeof popupLayer.openPopup === 'function')
        {
        popupLayer.openPopup()
        }
    })

    popupLayer.on('mouseout', () =>
    {
        isMarkerHovered = false
        scheduleClose()
    })

    popupLayer.on('popupopen', (event: L.PopupEvent) =>
    {
        const popupElement = event.popup.getElement()

        if (!popupElement)
        {
        return
        }

        popupElement.addEventListener('mouseenter', () =>
        {
        isPopupHovered = true
        clearCloseTimeout()
        })

        popupElement.addEventListener('mouseleave', () =>
        {
        isPopupHovered = false
        scheduleClose()
        })
    })

    popupLayer.on('popupclose', () =>
    {
        isPopupHovered = false
        clearCloseTimeout()
    })
}

function SettlementPointsLayer({ entry }: { entry: SettlementPointsLayerEntry })
{
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() =>
  {
    const handleZoomEnd = () =>
    {
      setZoom(map.getZoom())
    }

    map.on('zoomend', handleZoomEnd)

    return () =>
    {
      map.off('zoomend', handleZoomEnd)
    }
  }, [map])

  const pointToLayerHandler = (_feature: GeoJSON.Feature, latlng: L.LatLng) =>
  {
    const properties = _feature.properties
    const isVisible = shouldShowTown(properties, zoom)

    return L.circleMarker(latlng, {
      radius: isVisible ? 4 : 0,
      color: '#000000',
      weight: 1,
      fillColor: '#000000',
      fillOpacity: isVisible ? 1 : 0,
      opacity: isVisible ? 1 : 0,
      interactive: isVisible,
    })
  }

  return (
    <GeoJSON
      key={`${entry.id}-${zoom}`}
      data={entry.data}
      onEachFeature={(feature, layer) => onEachFeatureHandler(feature, layer, zoom, entry)}
      pointToLayer={pointToLayerHandler}
    />
  )
}
