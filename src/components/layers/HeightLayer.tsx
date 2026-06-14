import { GeoJSON } from 'react-leaflet'

type HeightLayerEntry =
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

type HeightColorRule =
  {
    minHeightExclusive: number
    color: string
  }

const HEIGHT_COLOR_RULES: HeightColorRule[] =
  [
    { minHeightExclusive: 20477, color: '#ffffff' },
    { minHeightExclusive: 17500, color: '#d9d9d9' },
    { minHeightExclusive: 15000, color: '#b8b8b8' },
    { minHeightExclusive: 12500, color: '#9f9f9f' },
    { minHeightExclusive: 10000, color: '#947f74' },
    { minHeightExclusive: 7500, color: '#9d836b' },
    { minHeightExclusive: 5000, color: '#af9667' },
    { minHeightExclusive: 3500, color: '#9db562' },
    { minHeightExclusive: 2000, color: '#7eab57' },
    { minHeightExclusive: 1000, color: '#629a46' },
    { minHeightExclusive: 500, color: '#4a7f36' },
  ]

function parseFiniteNumber(value: unknown): number | null
{
  if (typeof value === 'number' && Number.isFinite(value))
  {
    return value
  }

  if (typeof value === 'string')
  {
    const parsedNumber = Number(value)

    if (Number.isFinite(parsedNumber))
    {
      return parsedNumber
    }
  }

  return null
}

function getHeightColor(height: number): string
{
  for (const rule of HEIGHT_COLOR_RULES)
  {
    if (height > rule.minHeightExclusive)
    {
      return rule.color
    }
  }

  return '#2f5f2d'
}

export function getHeightLayer(entry: HeightLayerEntry)
{
  const styleFeature = (feature?: GeoJSON.Feature) =>
  {
    const properties = feature?.properties
    const featureType = properties?.type
    const height = parseFiniteNumber(properties?.height)

    if (featureType === 'lake' || height === null || height <= 0)
    {
      return {
        stroke: false,
        fillColor: 'transparent',
        fillOpacity: 0,
      }
    }

    const fillColor = getHeightColor(height)

    return {
      stroke: false,
      fillColor,
      fillOpacity: entry.options.fillOpacity ?? 0.75,
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
