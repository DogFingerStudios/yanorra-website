import { useEffect, useState, useMemo } from 'react'
import { GeoJSON, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import './Routes.css'

const STREET_LABEL_MIN_ZOOM = 15
const STREET_WIDTH_METERS = 9
const STREET_CASING_EXTRA_METERS = 2
const STREET_MIN_PIXEL_WIDTH = 1
const STREET_MIN_CASING_DELTA_PX = 1.2
const EARTH_CIRCUMFERENCE_METERS = 40075016.686

type StreetsLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options:
  {
    color?: string
    weight?: number
  }
}

export function getStreetsLayer(entry: StreetsLayerEntry)
{
  const getPixelsForMeters = (meters: number, zoom: number, latitude: number) =>
  {
    const latitudeInRadians = latitude * (Math.PI / 180)
    const metersPerPixel = (EARTH_CIRCUMFERENCE_METERS * Math.cos(latitudeInRadians)) / Math.pow(2, zoom + 8)

    if (metersPerPixel <= 0)
    {
      return STREET_MIN_PIXEL_WIDTH
    }

    const widthInPixels = meters / metersPerPixel

    if (widthInPixels < STREET_MIN_PIXEL_WIDTH)
    {
      return STREET_MIN_PIXEL_WIDTH
    }

    return widthInPixels
  }

  const StreetsGeoJson = () =>
  {
    const [currentZoom, setCurrentZoom] = useState(5)
    const [currentLatitude, setCurrentLatitude] = useState(0)

    const syncMapScale = () =>
    {
      const center = map.getCenter()
      setCurrentZoom(map.getZoom())
      setCurrentLatitude(center.lat)
    }

    const map = useMapEvents({
      zoomend: () =>
      {
        syncMapScale()
      },
      moveend: () =>
      {
        syncMapScale()
      },
    })

    useEffect(() =>
    {
      syncMapScale()
    }, [map])

    const showStreetLabels = currentZoom >= STREET_LABEL_MIN_ZOOM

    const cachedRoadWeights = useMemo(() =>
    {
      const fillWeight = getPixelsForMeters(STREET_WIDTH_METERS, currentZoom, currentLatitude)
      const casingWeightByMeters = getPixelsForMeters(STREET_WIDTH_METERS + STREET_CASING_EXTRA_METERS, currentZoom, currentLatitude)
      let casingWeight = casingWeightByMeters

      if (casingWeight < fillWeight + STREET_MIN_CASING_DELTA_PX)
      {
        casingWeight = fillWeight + STREET_MIN_CASING_DELTA_PX
      }

      return { fillWeight, casingWeight }
    }, [currentZoom, currentLatitude])

    const getStreetStyle = (feature: GeoJSON.Feature, stylePass: 'casing' | 'fill') =>
    {
      const roadWeight = cachedRoadWeights.fillWeight
      const roadCasingWeight = cachedRoadWeights.casingWeight

      const properties = feature.properties

      // Use this block to style specific roads later by feature properties.
      // Example fields often available: name, class, type, category.
      let roadColor = '#ffffff'
      let roadFillWeight = roadWeight

      if (properties && typeof properties === 'object')
      {
        // Example: make a specific road wider.
        // if (properties.name === 'West 2nd Avenue')
        // {
        //   roadWeight = baseWeight * 1.35
        // }

        // Example: recolor one road class.
        // if (properties.class === 'major')
        // {
        //   roadColor = '#f2d589'
        // }
      }

      if (stylePass === 'casing')
      {
        return {
          // color: '#dfdddb',
          color: '#000000',
          weight: roadCasingWeight,
          opacity: 1,
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
        }
      }

      let fallbackColor = '#ffff00'

      if (entry.options.color)
      {
        fallbackColor = entry.options.color
      }

      let finalColor = roadColor

      if (finalColor === '#f7f7f5')
      {
        finalColor = fallbackColor
      }

      return {
        color: finalColor,
        weight: roadFillWeight,
        opacity: 1,
        lineCap: 'round' as const,
        lineJoin: 'round' as const,
      }
    }

    const onEachStreetLabel = (feature: GeoJSON.Feature, layer: L.Layer) =>
    {
      const properties = feature.properties

      if (!properties || typeof properties !== 'object')
      {
        return
      }

      const streetName = properties.name

      if (typeof streetName !== 'string' || streetName.trim() === '')
      {
        return
      }

      const tooltipLayer = layer as L.Layer &
      {
        bindTooltip?: (content: string, options?: L.TooltipOptions) => L.Layer
      }

      if (typeof tooltipLayer.bindTooltip === 'function')
      {
        tooltipLayer.bindTooltip(streetName, {
          permanent: true,
          direction: 'center',
          opacity: 1,
          interactive: false,
          className: 'street-label-tooltip',
        })
      }
    }

    return (
      <>
        <GeoJSON
          key={`${entry.id}-casing`}
          data={entry.data}
          style={(feature) =>
          {
            if (!feature)
            {
              return {}
            }

            return getStreetStyle(feature, 'casing')
          }}
        />
        <GeoJSON
          key={`${entry.id}-fill`}
          data={entry.data}
          style={(feature) =>
          {
            if (!feature)
            {
              return {}
            }

            return getStreetStyle(feature, 'fill')
          }}
        />
        {showStreetLabels && (
          <GeoJSON
            key={`${entry.id}-labels`}
            data={entry.data}
            style={() =>
            {
              return {
                color: 'transparent',
                weight: 0,
                opacity: 0,
              }
            }}
            onEachFeature={onEachStreetLabel}
          />
        )}
      </>
    )
  }

  return <StreetsGeoJson key={entry.id} />
}