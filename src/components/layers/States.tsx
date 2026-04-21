import { GeoJSON } from 'react-leaflet'

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
    />
  )
}