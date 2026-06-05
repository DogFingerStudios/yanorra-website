import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import './StreetsLayer.css'

type StreetsLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options:
  {
    color?: string
    fillColor?: string
    weight?: number
    fillOpacity?: number
    labelMinZoom?: number
    labelMaxCount?: number
  }
}

export function getStreetsLayer(entry: StreetsLayerEntry)
{
  const styleFeature = () =>
  {
    const baseColor = entry.options.color ?? '#cbd8bf'

    return {
      color: baseColor,
      fillColor: entry.options.fillColor ?? baseColor,
      weight: entry.options.weight ?? 1,
      fillOpacity: entry.options.fillOpacity ?? 1,
      opacity: 1,
    }
  }

  return (
    <>
      <GeoJSON
        key={entry.id}
        data={entry.data}
        style={styleFeature}
      />
      <StreetNameLabels
        entry={entry}
        labelMinZoom={entry.options.labelMinZoom ?? 10}
        labelMaxCount={entry.options.labelMaxCount ?? 200}
      />
    </>
  )
}

type StreetLabel =
{
  id: string
  name: string
  position: [number, number]
}

function getMidpointPosition(lineCoordinates: unknown): [number, number] | null
{
  if (!Array.isArray(lineCoordinates) || lineCoordinates.length === 0)
  {
    return null
  }

  const midpointIndex = Math.floor(lineCoordinates.length / 2)
  const midpoint = lineCoordinates[midpointIndex]

  if (!Array.isArray(midpoint) || midpoint.length < 2)
  {
    return null
  }

  const lng = midpoint[0]
  const lat = midpoint[1]

  if (typeof lat !== 'number' || typeof lng !== 'number')
  {
    return null
  }

  return [lat, lng]
}

function getFeatureLabelPosition(feature: GeoJSON.Feature): [number, number] | null
{
  const geometry = feature.geometry

  if (!geometry)
  {
    return null
  }

  if (geometry.type === 'LineString')
  {
    return getMidpointPosition(geometry.coordinates)
  }

  if (geometry.type === 'MultiLineString')
  {
    const lines = geometry.coordinates

    if (!Array.isArray(lines) || lines.length === 0)
    {
      return null
    }

    let longestLine: unknown[] | null = null

    for (const line of lines)
    {
      if (!Array.isArray(line))
      {
        continue
      }

      if (longestLine === null || line.length > longestLine.length)
      {
        longestLine = line
      }
    }

    if (!longestLine)
    {
      return null
    }

    return getMidpointPosition(longestLine)
  }

  return null
}

function extractStreetLabels(data: GeoJSON.GeoJsonObject, maxCount: number): StreetLabel[]
{
  const labels: StreetLabel[] = []
  const seenNames = new Set<string>()
  const safeMaxCount = Math.max(maxCount, 0)

  if (!('features' in data) || !Array.isArray(data.features))
  {
    return labels
  }

  for (let index = 0; index < data.features.length; index += 1)
  {
    if (labels.length >= safeMaxCount)
    {
      break
    }

    const feature = data.features[index]

    if (!feature || feature.type !== 'Feature')
    {
      continue
    }

    const properties = feature.properties

    if (!properties)
    {
      continue
    }

    // const streetName = properties.name
    const streetName = 'Street Name'

    if (typeof streetName !== 'string' || streetName.trim() === '')
    {
      continue
    }

    const normalizedName = streetName.trim().toLowerCase()

    if (seenNames.has(normalizedName))
    {
      continue
    }

    const position = getFeatureLabelPosition(feature)

    if (!position)
    {
      continue
    }

    seenNames.add(normalizedName)
    labels.push({
      id: `${index}-${normalizedName}`,
      name: streetName.trim(),
      position,
    })
  }

  return labels
}

function StreetNameLabels({ entry, labelMinZoom, labelMaxCount }: { entry: StreetsLayerEntry, labelMinZoom: number, labelMaxCount: number })
{
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const labelAnchorIcon = useMemo(() =>
  {
    return L.divIcon({
      className: 'street-label-anchor',
      iconSize: [1, 1],
      iconAnchor: [0, 0],
    })
  }, [])
  const labels = useMemo(() =>
  {
    return extractStreetLabels(entry.data, labelMaxCount)
  }, [entry.data, labelMaxCount])

  useEffect(() =>
  {
    const handleZoomEnd = () =>
    {
      setZoom(map.getZoom())
    }

    map.on('zoomend', handleZoomEnd)

    return () =>
    {
      map.off('zoomend', handleZoomEnd)
    }
  }, [map])

  if (zoom < labelMinZoom)
  {
    return null
  }

  return (
    <>
      {labels.map((label) =>
      {
        return (
          <Marker
            key={`${entry.id}-street-label-${label.id}`}
            position={label.position}
            icon={labelAnchorIcon}
            opacity={0}
            interactive={false}
          >
            <Tooltip
              permanent
              direction='center'
              opacity={0.95}
              className='street-label-tooltip'
            >
              {label.name}
            </Tooltip>
          </Marker>
        )
      })}
    </>
  )
}
