import { GeoJSON } from 'react-leaflet'
import L from 'leaflet'

type StatesLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options:
  {
    color?: string
    weight?: number
    fillColor?: string
    fillOpacity?: number
  }
}

export function getStatesLayer(entry: StatesLayerEntry)
{
  const onEachFeatureHandler = (feature: GeoJSON.Feature, layer: L.Layer) =>
  {
    const properties = feature.properties

    if (!properties)
    {
      return
    }

    const stateName = properties.State

    if (typeof stateName !== 'string' || stateName.trim() === '')
    {
      return
    }

    const tooltipLayer = layer as L.Layer &
    {
      bindTooltip?: (content: string, options?: L.TooltipOptions) => L.Layer
    }

    if (typeof tooltipLayer.bindTooltip === 'function')
    {
      tooltipLayer.bindTooltip(stateName, {
        permanent: true,
        direction: 'center',
        opacity: 0.9,
      })
    }
  }

  return (
    <GeoJSON key={entry.id} data={entry.data} style={() =>
      {
        return {
          color: entry.options.color,
          weight: entry.options.weight,
          fillColor: entry.options.fillColor,
          fillOpacity: entry.options.fillOpacity,
        }
      }}
      onEachFeature={onEachFeatureHandler}
    />
  )
}