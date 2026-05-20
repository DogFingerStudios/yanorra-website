import { GeoJSON } from 'react-leaflet'
import './ParksLayer.css'

type ParksLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options:
  {
    color?: string
    fillColor?: string
    weight?: number
    fillOpacity?: number
  }
}

export function getParksLayer(entry: ParksLayerEntry)
{
  const styleFeature = () =>
  {
    const baseColor = entry.options.color ?? '#00DD00'

    return {
      color: baseColor,
      fillColor: entry.options.fillColor ?? baseColor,
      weight: entry.options.weight ?? 1,
      fillOpacity: entry.options.fillOpacity ?? 1,
      opacity: 1,
    }
  }

  return (
    <GeoJSON
      key={entry.id}
      data={entry.data}
      style={styleFeature}
    />
  )
}
