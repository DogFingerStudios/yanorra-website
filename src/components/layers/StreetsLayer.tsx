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
    _renderPhase?: 'outline' | 'center' | 'both'
  }
}

function getPerpendicularOffset(
  p1: number[],
  p2: number[],
  distance: number,
): [number[], number[]]
{
  // Vector from p1 to p2
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const len = Math.sqrt(dx * dx + dy * dy)

  if (len === 0)
  {
    return [[p1[0], p1[1]], [p1[0], p1[1]]]
  }

  // Perpendicular vector (rotated 90 degrees)
  const perpX = (-dy / len) * distance
  const perpY = (dx / len) * distance

  return [
    [p1[0] + perpX, p1[1] + perpY],
    [p1[0] - perpX, p1[1] - perpY],
  ]
}

function lineToPolygon(lineCoordinates: number[][], roadWidth: number): number[][][]
{
  if (lineCoordinates.length < 2)
  {
    return []
  }

  const leftSide: number[][] = []
  const rightSide: number[][] = []

  // For each point, calculate perpendicular offsets
  for (let i = 0; i < lineCoordinates.length; i += 1)
  {
    const current = lineCoordinates[i]
    const prev = i > 0 ? lineCoordinates[i - 1] : lineCoordinates[1]
    const next = i < lineCoordinates.length - 1 ? lineCoordinates[i + 1] : lineCoordinates[i - 1]

    // Calculate perpendicular for incoming and outgoing segments
    const [leftIn, rightIn] = getPerpendicularOffset(prev, current, roadWidth)
    const [leftOut, rightOut] = getPerpendicularOffset(current, next, roadWidth)

    // Average the perpendiculars for smooth joints
    const avgLeft = [
      (leftIn[0] + leftOut[0]) / 2,
      (leftIn[1] + leftOut[1]) / 2,
    ]
    const avgRight = [
      (rightIn[0] + rightOut[0]) / 2,
      (rightIn[1] + rightOut[1]) / 2,
    ]

    leftSide.push(avgLeft)
    rightSide.push(avgRight)
  }

  // Create polygon: left side forward, right side backward, close the loop
  const polygonCoords = [...leftSide, ...rightSide.reverse(), leftSide[0]]

  return [polygonCoords]
}

function convertLinesToPolygons(
  data: GeoJSON.GeoJsonObject,
  roadWidth: number,
): {
  outlines: GeoJSON.GeoJsonObject
  centers: GeoJSON.GeoJsonObject
}
{
  const outlineData = JSON.parse(JSON.stringify(data)) as GeoJSON.GeoJsonObject
  const centerData = JSON.parse(JSON.stringify(data)) as GeoJSON.GeoJsonObject

  const centerWidth = roadWidth * 0.6

  if ('features' in outlineData && Array.isArray(outlineData.features))
  {
    for (let i = 0; i < outlineData.features.length; i += 1)
    {
      const outlineFeature = outlineData.features[i]
      const centerFeature =
        'features' in centerData && Array.isArray(centerData.features)
          ? centerData.features[i]
          : null

      if (!outlineFeature.geometry || !centerFeature)
      {
        continue
      }

      if (outlineFeature.geometry.type === 'LineString')
      {
        const coords = outlineFeature.geometry.coordinates as number[][]
        const outlinePolygon = lineToPolygon(coords, roadWidth)
        const centerPolygon = lineToPolygon(coords, centerWidth)

        outlineFeature.geometry.type = 'MultiPolygon'
        outlineFeature.geometry.coordinates = outlinePolygon
        centerFeature.geometry.type = 'MultiPolygon'
        centerFeature.geometry.coordinates = centerPolygon
      }
      else if (outlineFeature.geometry.type === 'MultiLineString')
      {
        const lines = outlineFeature.geometry.coordinates as number[][][]
        const outlineMultiPolygon: number[][][] = []
        const centerMultiPolygon: number[][][] = []

        for (const line of lines)
        {
          const outlinePolygon = lineToPolygon(line, roadWidth)
          const centerPolygon = lineToPolygon(line, centerWidth)
          outlineMultiPolygon.push(...outlinePolygon)
          centerMultiPolygon.push(...centerPolygon)
        }

        outlineFeature.geometry.type = 'MultiPolygon'
        outlineFeature.geometry.coordinates = outlineMultiPolygon
        centerFeature.geometry.type = 'MultiPolygon'
        centerFeature.geometry.coordinates = centerMultiPolygon
      }
    }
  }

  return { outlines: outlineData, centers: centerData }
}

export function getStreetsLayer(entry: StreetsLayerEntry)
{
  const roadWidth = (entry.options.weight ?? 1) / 2 / 111320 // Convert pixels to lat/lng approximation
  const { outlines, centers } = convertLinesToPolygons(entry.data, roadWidth)

  const roadColor = entry.options.color ?? '#000000'
  const renderPhase = entry.options._renderPhase ?? 'both'

  const outlineStyle = (): L.PathOptions =>
  {
    return {
      color: roadColor,
      weight: 2.5,
      fillColor: roadColor,
      fillOpacity: 1,
    }
  }

  const centerStyle = (): L.PathOptions =>
  {
    return {
      color: '#fff',
      weight: 0,
      fillColor: '#fff',
      fillOpacity: 1,
    }
  }

  return (
    <>
      {(renderPhase === 'outline' || renderPhase === 'both') && (
        <GeoJSON
          key={`${entry.id}-outline`}
          data={outlines}
          style={outlineStyle}
        />
      )}
      {(renderPhase === 'center' || renderPhase === 'both') && (
        <GeoJSON
          key={`${entry.id}-center`}
          data={centers}
          style={centerStyle}
        />
      )}
      {renderPhase === 'both' && (
        <StreetNameLabels
          entry={entry}
          labelMinZoom={entry.options.labelMinZoom ?? 10}
          labelMaxCount={entry.options.labelMaxCount ?? 200}
        />
      )}
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
