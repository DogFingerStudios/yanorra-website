import { GeoJSON } from 'react-leaflet'

type BiomesLayerEntry =
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

export function getBiomesLayer(entry: BiomesLayerEntry)
{
  const styleFeature = (feature?: GeoJSON.Feature) =>
  {
    const properties = feature?.properties
    let biomeColor: string | undefined

    if (properties)
    {
      const value = properties.Biomes_Color

      if (typeof value === 'string' && value.trim() !== '')
      {
        biomeColor = value
      }
    }

    return {
      color: biomeColor,
      stroke: false,
      opacity: 0.5,
      fillColor: biomeColor ?? entry.options.fillColor,
      fillOpacity: entry.options.fillOpacity,
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
