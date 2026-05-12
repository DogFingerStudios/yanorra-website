import { useEffect, useState } from 'react'
import { GeoJSON, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import './Routes.css'

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
  const getScaledStreetWeight = (zoom: number) =>
  {
    const baseWeight = entry.options.weight ?? 1.15
    const zoomFactor = 1 + Math.max(0, zoom - 5) * 0.55
    const clampedFactor = Math.min(zoomFactor, 7)

    return baseWeight * clampedFactor
  }

  const StreetsGeoJson = () =>
  {
    const [currentZoom, setCurrentZoom] = useState(5)

    const map = useMapEvents({
      zoomend: () =>
      {
        setCurrentZoom(map.getZoom())
      },
    })

    useEffect(() =>
    {
      setCurrentZoom(map.getZoom())
    }, [map])

    const styleFeature = () =>
    {
      return {
        color: entry.options.color ?? '#5a5a5a',
        weight: getScaledStreetWeight(currentZoom),
        opacity: 1,
        lineCap: 'square' as const,
        lineJoin: 'miter' as const,
      }
    }

    return (
      <GeoJSON
        key={entry.id}
        data={entry.data}
        style={styleFeature}
        onEachFeature={onEachFeatureHandler}
      />
    )
  }

  const onEachFeatureHandler = (feature: GeoJSON.Feature, layer: L.Layer) =>
  {
    const properties = feature.properties

    if (!properties)
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
        permanent: false,
        direction: 'top',
        opacity: 0.9,
        className: 'route-label-tooltip',
      })
    }
  }

  return <StreetsGeoJson key={entry.id} />
}