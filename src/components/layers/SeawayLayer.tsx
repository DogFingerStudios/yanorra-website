import { GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import './Routes.css'

type SeawayLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
}

export function getSeawayLayer(entry: SeawayLayerEntry)
{
  const styleFeature = () =>
  {
    return {
      color: '#0000FF',
      weight: 2,
      dashArray: '5, 5',
      opacity: 0.35,
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

    const routeName = properties.name

    if (typeof routeName !== 'string' || routeName.trim() === '')
    {
      return
    }

    const tooltipLayer = layer as L.Layer &
    {
      bindTooltip?: (content: string, options?: L.TooltipOptions) => L.Layer
    }

    if (typeof tooltipLayer.bindTooltip === 'function')
    {
      tooltipLayer.bindTooltip(routeName, {
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
