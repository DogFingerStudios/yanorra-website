import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import './StreetsLayer.css'

export const STREET_OUTLINE_PANE = 'streetOutlinePane'
export const STREET_CENTER_PANE = 'streetCenterPane'
export const STREET_LABEL_PANE = 'streetLabelPane'
const STREET_NAME_FALLBACK_PRIMARY = 'Test Street'
const STREET_NAME_FALLBACK_SECONDARY = 'Unnamed Road'

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
          pane={STREET_OUTLINE_PANE}
        />
      )}
      {(renderPhase === 'center' || renderPhase === 'both') && (
        <GeoJSON
          key={`${entry.id}-center`}
          data={centers}
          style={centerStyle}
          pane={STREET_CENTER_PANE}
        />
      )}
      {renderPhase !== 'outline' && (
        <StreetNameLabels
          entry={entry}
          labelMinZoom={entry.options.labelMinZoom ?? 16}
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
  angle: number
}

type LabelPlacement =
{
  position: [number, number]
  angle: number
}

function escapeHtml(value: string): string
{
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getStreetLabelIcon(label: StreetLabel): L.DivIcon
{
  const rotation = -label.angle.toFixed(1)
  const safeName = escapeHtml(`${label.name} [${rotation}°]`)

  return L.divIcon({
    className: 'street-label-marker',
    html: `<span class="street-label-text" style="transform: rotate(${rotation}deg)">${safeName}</span>`,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  })
}

function getLineLength(lineCoordinates: unknown): number
{
  if (!Array.isArray(lineCoordinates) || lineCoordinates.length < 2)
  {
    return 0
  }

  let totalLength = 0

  for (let index = 1; index < lineCoordinates.length; index += 1)
  {
    const previousPoint = lineCoordinates[index - 1]
    const currentPoint = lineCoordinates[index]

    if (!Array.isArray(previousPoint) || !Array.isArray(currentPoint))
    {
      continue
    }

    if (previousPoint.length < 2 || currentPoint.length < 2)
    {
      continue
    }

    const previousLng = previousPoint[0]
    const previousLat = previousPoint[1]
    const currentLng = currentPoint[0]
    const currentLat = currentPoint[1]

    if (
      typeof previousLng !== 'number'
      || typeof previousLat !== 'number'
      || typeof currentLng !== 'number'
      || typeof currentLat !== 'number'
    )
    {
      continue
    }

    const deltaLng = currentLng - previousLng
    const deltaLat = currentLat - previousLat
    totalLength += Math.sqrt((deltaLng * deltaLng) + (deltaLat * deltaLat))
  }

  return totalLength
}

function getMidpointPosition(lineCoordinates: unknown): [number, number] | null
{
  if (!Array.isArray(lineCoordinates) || lineCoordinates.length === 0)
  {
    return null
  }

  if (lineCoordinates.length === 1)
  {
    const point = lineCoordinates[0]

    if (!Array.isArray(point) || point.length < 2)
    {
      return null
    }

    const lng = point[0]
    const lat = point[1]

    if (typeof lat !== 'number' || typeof lng !== 'number')
    {
      return null
    }

    return [lat, lng]
  }

  const totalLength = getLineLength(lineCoordinates)

  if (totalLength <= 0)
  {
    const fallbackPoint = lineCoordinates[Math.floor(lineCoordinates.length / 2)]

    if (!Array.isArray(fallbackPoint) || fallbackPoint.length < 2)
    {
      return null
    }

    const fallbackLng = fallbackPoint[0]
    const fallbackLat = fallbackPoint[1]

    if (typeof fallbackLat !== 'number' || typeof fallbackLng !== 'number')
    {
      return null
    }

    return [fallbackLat, fallbackLng]
  }

  const midpointDistance = totalLength / 2
  let traversedDistance = 0

  for (let index = 1; index < lineCoordinates.length; index += 1)
  {
    const previousPoint = lineCoordinates[index - 1]
    const currentPoint = lineCoordinates[index]

    if (!Array.isArray(previousPoint) || !Array.isArray(currentPoint))
    {
      continue
    }

    if (previousPoint.length < 2 || currentPoint.length < 2)
    {
      continue
    }

    const previousLng = previousPoint[0]
    const previousLat = previousPoint[1]
    const currentLng = currentPoint[0]
    const currentLat = currentPoint[1]

    if (
      typeof previousLng !== 'number'
      || typeof previousLat !== 'number'
      || typeof currentLng !== 'number'
      || typeof currentLat !== 'number'
    )
    {
      continue
    }

    const deltaLng = currentLng - previousLng
    const deltaLat = currentLat - previousLat
    const segmentLength = Math.sqrt((deltaLng * deltaLng) + (deltaLat * deltaLat))

    if (segmentLength === 0)
    {
      continue
    }

    if (traversedDistance + segmentLength >= midpointDistance)
    {
      const remainingDistance = midpointDistance - traversedDistance
      const ratio = remainingDistance / segmentLength
      const midpointLng = previousLng + (deltaLng * ratio)
      const midpointLat = previousLat + (deltaLat * ratio)
      return [midpointLat, midpointLng]
    }

    traversedDistance += segmentLength
  }

  const lastPoint = lineCoordinates[lineCoordinates.length - 1]

  if (!Array.isArray(lastPoint) || lastPoint.length < 2)
  {
    return null
  }

  const lng = lastPoint[0]
  const lat = lastPoint[1]

  if (typeof lat !== 'number' || typeof lng !== 'number')
  {
    return null
  }

  return [lat, lng]
}

function normalizeTextAngle(angle: number): number
{
  if (angle > 90)
  {
    return angle - 180
  }

  if (angle < -90)
  {
    return angle + 180
  }

  return angle
}

function getLineMidpointPlacement(lineCoordinates: unknown): LabelPlacement | null
{
  const midpoint = getMidpointPosition(lineCoordinates)

  if (!midpoint)
  {
    return null
  }

  if (!Array.isArray(lineCoordinates) || lineCoordinates.length < 2)
  {
    return {
      position: midpoint,
      angle: 0,
    }
  }

  const totalLength = getLineLength(lineCoordinates)

  if (totalLength <= 0)
  {
    return {
      position: midpoint,
      angle: 0,
    }
  }

  const midpointDistance = totalLength / 2
  let traversedDistance = 0

  for (let index = 1; index < lineCoordinates.length; index += 1)
  {
    const previousPoint = lineCoordinates[index - 1]
    const currentPoint = lineCoordinates[index]

    if (!Array.isArray(previousPoint) || !Array.isArray(currentPoint))
    {
      continue
    }

    if (previousPoint.length < 2 || currentPoint.length < 2)
    {
      continue
    }

    const previousLng = previousPoint[0]
    const previousLat = previousPoint[1]
    const currentLng = currentPoint[0]
    const currentLat = currentPoint[1]

    if (
      typeof previousLng !== 'number'
      || typeof previousLat !== 'number'
      || typeof currentLng !== 'number'
      || typeof currentLat !== 'number'
    )
    {
      continue
    }

    const deltaLng = currentLng - previousLng
    const deltaLat = currentLat - previousLat
    const segmentLength = Math.sqrt((deltaLng * deltaLng) + (deltaLat * deltaLat))

    if (segmentLength === 0)
    {
      continue
    }

    if (traversedDistance + segmentLength >= midpointDistance)
    {
      const rawAngle = (Math.atan2(deltaLat, deltaLng) * 180) / Math.PI
      return {
        position: midpoint,
        angle: normalizeTextAngle(rawAngle),
      }
    }

    traversedDistance += segmentLength
  }

  return {
    position: midpoint,
    angle: 0,
  }
}

function getFeatureLabelPlacement(feature: GeoJSON.Feature): LabelPlacement | null
{
  const geometry = feature.geometry

  if (!geometry)
  {
    return null
  }

  if (geometry.type === 'LineString')
  {
    return getLineMidpointPlacement(geometry.coordinates)
  }

  if (geometry.type === 'MultiLineString')
  {
    const lines = geometry.coordinates

    if (!Array.isArray(lines) || lines.length === 0)
    {
      return null
    }

    let longestLine: unknown[] | null = null
    let longestLineLength = 0

    for (const line of lines)
    {
      if (!Array.isArray(line))
      {
        continue
      }

      const currentLength = getLineLength(line)

      if (longestLine === null || currentLength > longestLineLength)
      {
        longestLine = line
        longestLineLength = currentLength
      }
    }

    if (!longestLine)
    {
      return null
    }

    return getLineMidpointPlacement(longestLine)
  }

  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')
  {
    const boundsCenter = getBoundsCenterFromCoordinates(geometry.coordinates)

    if (!boundsCenter)
    {
      return null
    }

    return {
      position: boundsCenter,
      angle: getLongestSegmentAngleFromCoordinates(geometry.coordinates),
    }
  }

  return null
}

function getBoundsCenterFromCoordinates(coordinates: unknown): [number, number] | null
{
  const points: number[][] = []

  const collectPoints = (value: unknown) =>
  {
    if (!Array.isArray(value))
    {
      return
    }

    if (
      value.length >= 2
      && typeof value[0] === 'number'
      && typeof value[1] === 'number'
    )
    {
      points.push([value[0], value[1]])
      return
    }

    for (const nestedValue of value)
    {
      collectPoints(nestedValue)
    }
  }

  collectPoints(coordinates)

  if (points.length === 0)
  {
    return null
  }

  let minLng = points[0][0]
  let maxLng = points[0][0]
  let minLat = points[0][1]
  let maxLat = points[0][1]

  for (let index = 1; index < points.length; index += 1)
  {
    const point = points[index]
    const lng = point[0]
    const lat = point[1]

    if (lng < minLng)
    {
      minLng = lng
    }

    if (lng > maxLng)
    {
      maxLng = lng
    }

    if (lat < minLat)
    {
      minLat = lat
    }

    if (lat > maxLat)
    {
      maxLat = lat
    }
  }

  return [
    (minLat + maxLat) / 2,
    (minLng + maxLng) / 2,
  ]
}

function getLongestSegmentAngleFromCoordinates(coordinates: unknown): number
{
  let bestLength = 0
  let bestAngle = 0

  const visit = (value: unknown) =>
  {
    if (!Array.isArray(value))
    {
      return
    }

    let canTreatAsLine = value.length >= 2

    if (canTreatAsLine)
    {
      for (const point of value)
      {
        if (!Array.isArray(point) || point.length < 2 || typeof point[0] !== 'number' || typeof point[1] !== 'number')
        {
          canTreatAsLine = false
          break
        }
      }
    }

    if (canTreatAsLine)
    {
      for (let index = 1; index < value.length; index += 1)
      {
        const previousPoint = value[index - 1] as number[]
        const currentPoint = value[index] as number[]
        const deltaLng = currentPoint[0] - previousPoint[0]
        const deltaLat = currentPoint[1] - previousPoint[1]
        const segmentLength = Math.sqrt((deltaLng * deltaLng) + (deltaLat * deltaLat))

        if (segmentLength > bestLength)
        {
          bestLength = segmentLength
          bestAngle = normalizeTextAngle((Math.atan2(deltaLat, deltaLng) * 180) / Math.PI)
        }
      }

      return
    }

    for (const nestedValue of value)
    {
      visit(nestedValue)
    }
  }

  visit(coordinates)
  return bestAngle
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

    const nameValue = properties.name
    const altNameValue = properties.alt_name
    let streetName = ''

    if (typeof nameValue === 'string' && nameValue.trim() !== '')
    {
      streetName = nameValue
    }
    else if (typeof altNameValue === 'string' && altNameValue.trim() !== '')
    {
      streetName = altNameValue
    }
    else
    {
      // Keep fallback labels unique so de-duplication does not collapse them into one.
      const fallbackIndex = index + 1
      streetName = `${STREET_NAME_FALLBACK_PRIMARY} ${fallbackIndex} ${STREET_NAME_FALLBACK_SECONDARY}`
    }

    if (typeof streetName !== 'string' || streetName.trim() === '')
    {
      continue
    }

    const normalizedName = streetName.trim().toLowerCase()

    if (seenNames.has(normalizedName))
    {
      continue
    }

    const placement = getFeatureLabelPlacement(feature)

    if (!placement)
    {
      continue
    }

    seenNames.add(normalizedName)
    labels.push({
      id: `${index}-${normalizedName}`,
      name: streetName.trim(),
      position: placement.position,
      angle: placement.angle,
    })
  }

  return labels
}

function StreetNameLabels({ entry, labelMinZoom, labelMaxCount }: { entry: StreetsLayerEntry, labelMinZoom: number, labelMaxCount: number })
{
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const labels = useMemo(() =>
  {
    return extractStreetLabels(entry.data, labelMaxCount)
  }, [entry.data, labelMaxCount])

  useEffect(() =>
  {
    const handleZoom = () =>
    {
      setZoom(map.getZoom())
    }

    const handleZoomEnd = () =>
    {
      setZoom(map.getZoom())
    }

    map.on('zoom', handleZoom)
    map.on('zoomend', handleZoomEnd)

    return () =>
    {
      map.off('zoom', handleZoom)
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
            icon={getStreetLabelIcon(label)}
            opacity={1}
            interactive={false}
            pane={STREET_LABEL_PANE}
          />
        )
      })}
    </>
  )
}
