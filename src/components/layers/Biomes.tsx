import { GeoJSON } from 'react-leaflet'
import './Biomes.css'

type BiomesLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options:
  {
    pane?: string
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
      const value = properties.biomes_data_Color
      if (typeof value === 'string' && value.trim() !== '')
      {
        biomeColor = value
      }
      else if (properties.type !== "lake")
      {
        console.warn('Property `biomes_data_Color` is missing or invalid for feature', feature)
      }
    }

    let resolvedFillColor = entry.options.fillColor

    if (biomeColor)
    {
      resolvedFillColor = biomeColor
    }

    return {
      color: resolvedFillColor,
      stroke: true,
      weight: 1,
      opacity: 0.35,
      lineJoin: 'round' as const,
      lineCap: 'round' as const,
      fillColor: resolvedFillColor,
      fillOpacity: entry.options.fillOpacity,
      className: 'biome-fill',
    }
  }

  return (
    <GeoJSON
      key={entry.id}
      data={entry.data}
      pane={entry.options.pane}
      style={styleFeature}
    />
  )
}
