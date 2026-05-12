import { GeoJSON } from 'react-leaflet'
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
  const styleFeature = () =>
  {
    return {
      color: entry.options.color ?? '#5a5a5a',
      weight: entry.options.weight ?? 1.15,
      opacity: 1,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    }
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

  return (
    <GeoJSON
      key={entry.id}
      data={entry.data}
      style={styleFeature}
      onEachFeature={onEachFeatureHandler}
    />
  )
}