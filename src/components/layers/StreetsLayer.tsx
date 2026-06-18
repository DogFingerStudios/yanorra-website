import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import './StreetsLayer.css'

export const STREET_OUTLINE_PANE = 'streetOutlinePane'
export const STREET_CENTER_PANE = 'streetCenterPane'
export const STREET_LABEL_PANE = 'streetLabelPane'
const STREET_LABELS_DEBUG_MODE = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).has('streetLabelsDebug')
  : false
const STREET_LABELS_PROBE_MODE = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).has('streetLabelsProbe')
  : false

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
    minZoom?: number
    labelMinZoom?: number
    labelMaxCount?: number
    labelRepeatDistance?: number
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
const [leftIn, rightIn] = getPerpendicularOffset(current, prev, roadWidth)
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
        <StreetNameSvgLabels
          entry={entry}
          labelMinZoom={entry.options.labelMinZoom ?? entry.options.minZoom ?? 12}
          labelMaxCount={entry.options.labelMaxCount ?? 300}
          labelRepeatDistance={entry.options.labelRepeatDistance ?? 300}
        />
      )}
    </>
  )
}

type StreetPathLabel =
{
  id: string
  name: string
  pathId: string
  startOffset: string
  anchorX: number
  anchorY: number
}

type StreetSvgPath =
{
  id: string
  d: string
}

type StreetPathLabelResult =
{
  paths: StreetSvgPath[]
  labels: StreetPathLabel[]
  featureCount: number
  usedRelaxedFallback: boolean
}

type LabelBox =
{
  left: number
  right: number
  top: number
  bottom: number
}

function getStreetName(feature: GeoJSON.Feature): string | null
{
  const properties = feature.properties

  if (!properties)
  {
    return null
  }

  const nameValue = properties.name
  const altNameValue = properties.alt_name

  if (typeof nameValue === 'string' && nameValue.trim() !== '')
  {
    return nameValue.trim()
  }

  if (typeof altNameValue === 'string' && altNameValue.trim() !== '')
  {
    return altNameValue.trim()
  }

  return null
}

function getFeatureLines(feature: GeoJSON.Feature): number[][][]
{
  const geometry = feature.geometry

  if (!geometry)
  {
    return []
  }

  if (geometry.type === 'LineString')
  {
    return [geometry.coordinates as number[][]]
  }

  if (geometry.type === 'MultiLineString')
  {
    return geometry.coordinates as number[][][]
  }

  if (geometry.type === 'Polygon')
  {
    const polygon = geometry.coordinates as number[][][]

    if (polygon.length === 0)
    {
      return []
    }

    const centerLine = getCenterLineFromRoadRing(polygon[0])

    if (centerLine.length < 2)
    {
      return []
    }

    return [centerLine]
  }

  if (geometry.type === 'MultiPolygon')
  {
    const multiPolygon = geometry.coordinates as number[][][][]
    const lines: number[][][] = []

    for (const polygon of multiPolygon)
    {
      if (!Array.isArray(polygon) || polygon.length === 0)
      {
        continue
      }

      const centerLine = getCenterLineFromRoadRing(polygon[0])

      if (centerLine.length >= 2)
      {
        lines.push(centerLine)
      }
    }

    return lines
  }

  return []
}

function pointsAreEqual(a: number[], b: number[]): boolean
{
  return a.length >= 2
    && b.length >= 2
    && Math.abs(a[0] - b[0]) < 1e-12
    && Math.abs(a[1] - b[1]) < 1e-12
}

function getCenterLineFromRoadRing(ringCoordinates: number[][]): number[][]
{
  if (!Array.isArray(ringCoordinates) || ringCoordinates.length < 4)
  {
    return []
  }

  let ring = ringCoordinates.filter((point) =>
  {
    return Array.isArray(point)
      && point.length >= 2
      && typeof point[0] === 'number'
      && typeof point[1] === 'number'
  })

  if (ring.length < 4)
  {
    return []
  }

  const firstPoint = ring[0]
  const lastPoint = ring[ring.length - 1]

  if (pointsAreEqual(firstPoint, lastPoint))
  {
    ring = ring.slice(0, -1)
  }

  if (ring.length < 4)
  {
    return []
  }

  const half = Math.floor(ring.length / 2)

  if (half < 2)
  {
    return []
  }

  const leftSide = ring.slice(0, half)
  const rightSideReversed = ring.slice(half)
  const pairCount = Math.min(leftSide.length, rightSideReversed.length)
  const centerLine: number[][] = []

  for (let index = 0; index < pairCount; index += 1)
  {
    const leftPoint = leftSide[index]
    const rightPoint = rightSideReversed[rightSideReversed.length - 1 - index]

    if (!leftPoint || !rightPoint)
    {
      continue
    }

    centerLine.push([
      (leftPoint[0] + rightPoint[0]) / 2,
      (leftPoint[1] + rightPoint[1]) / 2,
    ])
  }

  return centerLine
}

function getPointDistance(a: L.Point, b: L.Point): number
{
  const dx = b.x - a.x
  const dy = b.y - a.y

  return Math.sqrt((dx * dx) + (dy * dy))
}

function getProjectedLineLength(points: L.Point[]): number
{
  let length = 0

  for (let index = 1; index < points.length; index += 1)
  {
    length += getPointDistance(points[index - 1], points[index])
  }

  return length
}

function getPointAtDistance(points: L.Point[], targetDistance: number): L.Point | null
{
  if (points.length === 0)
  {
    return null
  }

  if (points.length === 1)
  {
    return points[0]
  }

  let traversedDistance = 0

  for (let index = 1; index < points.length; index += 1)
  {
    const previousPoint = points[index - 1]
    const currentPoint = points[index]
    const segmentLength = getPointDistance(previousPoint, currentPoint)

    if (segmentLength === 0)
    {
      continue
    }

    if (traversedDistance + segmentLength >= targetDistance)
    {
      const remainingDistance = targetDistance - traversedDistance
      const ratio = remainingDistance / segmentLength

      return L.point(
        previousPoint.x + ((currentPoint.x - previousPoint.x) * ratio),
        previousPoint.y + ((currentPoint.y - previousPoint.y) * ratio),
      )
    }

    traversedDistance += segmentLength
  }

  return points[points.length - 1]
}

function makeSvgPath(points: L.Point[]): string
{
  if (points.length === 0)
  {
    return ''
  }

  const [firstPoint, ...remainingPoints] = points
  const commands = [`M ${firstPoint.x.toFixed(1)} ${firstPoint.y.toFixed(1)}`]

  for (const point of remainingPoints)
  {
    commands.push(`L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
  }

  return commands.join(' ')
}

function shouldReverseLineForText(points: L.Point[]): boolean
{
  if (points.length < 2)
  {
    return false
  }

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  return lastPoint.x < firstPoint.x
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean
{
  return !(
    a.right < b.left
    || a.left > b.right
    || a.bottom < b.top
    || a.top > b.bottom
  )
}

function lineIntersectsBounds(line: number[][], bounds: L.LatLngBounds): boolean
{
  for (let index = 1; index < line.length; index += 1)
  {
    const previousPoint = line[index - 1]
    const currentPoint = line[index]

    if (
      !Array.isArray(previousPoint)
      || !Array.isArray(currentPoint)
      || previousPoint.length < 2
      || currentPoint.length < 2
    )
    {
      continue
    }

    const segmentBounds = L.latLngBounds(
      [previousPoint[1], previousPoint[0]],
      [currentPoint[1], currentPoint[0]],
    )

    if (bounds.intersects(segmentBounds))
    {
      return true
    }
  }

  return false
}

function estimateTextWidth(text: string): number
{
  return Math.max(48, text.length * 7.2)
}

function makeLabelBox(anchor: L.Point, textWidth: number): LabelBox
{
  const labelHeight = 18
  const padding = 6

  return {
    left: anchor.x - (textWidth / 2) - padding,
    right: anchor.x + (textWidth / 2) + padding,
    top: anchor.y - (labelHeight / 2) - padding,
    bottom: anchor.y + (labelHeight / 2) + padding,
  }
}

function boxIsInViewport(box: LabelBox, mapSize: L.Point): boolean
{
  return !(
    box.right < 0
    || box.left > mapSize.x
    || box.bottom < 0
    || box.top > mapSize.y
  )
}

function generateStreetPathLabels(
  data: GeoJSON.GeoJsonObject,
  map: L.Map,
  maxCount: number,
  repeatDistance: number,
  layerId: string,
  relaxedMode = false,
): StreetPathLabelResult
{
  const paths: StreetSvgPath[] = []
  const labels: StreetPathLabel[] = []
  const occupiedBoxes: LabelBox[] = []
  const pathMap = new Map<string, StreetSvgPath>()
  const mapBounds = map.getBounds().pad(0.15)
  const mapSize = map.getSize()
  const safeMaxCount = Math.max(maxCount, 0)
  const safeRepeatDistance = Math.max(120, repeatDistance)
  let featureCount = 0

  if (!('features' in data) || !Array.isArray(data.features))
  {
    return {
      paths,
      labels,
      featureCount,
      usedRelaxedFallback: relaxedMode,
    }
  }

  for (let featureIndex = 0; featureIndex < data.features.length; featureIndex += 1)
  {
    if (labels.length >= safeMaxCount)
    {
      break
    }

    const feature = data.features[featureIndex]

    if (!feature || feature.type !== 'Feature')
    {
      continue
    }

    const streetName = getStreetName(feature)

    if (!streetName)
    {
      continue
    }

    featureCount += 1

    const textWidth = estimateTextWidth(streetName)
    const lines = getFeatureLines(feature)

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1)
    {
      if (labels.length >= safeMaxCount)
      {
        break
      }

      const line = lines[lineIndex]

      if (!Array.isArray(line) || line.length < 2)
      {
        continue
      }

      if (!relaxedMode && !lineIntersectsBounds(line, mapBounds))
      {
        continue
      }

      let projectedPoints = line
        .filter((point) =>
        {
          return (
            Array.isArray(point)
            && point.length >= 2
            && typeof point[0] === 'number'
            && typeof point[1] === 'number'
          )
        })
        .map((point) =>
        {
          return map.latLngToContainerPoint([point[1], point[0]])
        })

      if (projectedPoints.length < 2)
      {
        continue
      }

      if (shouldReverseLineForText(projectedPoints))
      {
        projectedPoints = [...projectedPoints].reverse()
      }

      const pathLength = getProjectedLineLength(projectedPoints)

      if (!relaxedMode && pathLength < textWidth + 32)
      {
        continue
      }

      const safeLayerId = layerId.replace(/[^a-zA-Z0-9_-]/g, '-')
      const pathId = `street-label-path-${safeLayerId}-${featureIndex}-${lineIndex}`
      const pathD = makeSvgPath(projectedPoints)

      if (pathD === '')
      {
        continue
      }

      if (!pathMap.has(pathId))
      {
        const pathItem = {
          id: pathId,
          d: pathD,
        }

        pathMap.set(pathId, pathItem)
        paths.push(pathItem)
      }

      const minimumEndPadding = Math.max(30, textWidth / 2)
      const effectiveRepeatDistance = Math.max(safeRepeatDistance, textWidth * 2.2)

      let labelDistances: number[] = []

      if (relaxedMode)
      {
        labelDistances = [pathLength / 2]
      }
      else if (pathLength < effectiveRepeatDistance * 1.35)
      {
        labelDistances = [pathLength / 2]
      }
      else
      {
        for (
          let distance = minimumEndPadding + (effectiveRepeatDistance / 2);
          distance < pathLength - minimumEndPadding;
          distance += effectiveRepeatDistance
        )
        {
          labelDistances.push(distance)
        }
      }

      for (let labelIndex = 0; labelIndex < labelDistances.length; labelIndex += 1)
      {
        if (labels.length >= safeMaxCount)
        {
          break
        }

        const distance = labelDistances[labelIndex]
        const anchor = getPointAtDistance(projectedPoints, distance)

        if (!anchor)
        {
          continue
        }

        const labelBox = makeLabelBox(anchor, textWidth)

        if (!relaxedMode && !boxIsInViewport(labelBox, mapSize))
        {
          continue
        }

        const collides = !relaxedMode && occupiedBoxes.some((occupiedBox) =>
        {
          return boxesOverlap(labelBox, occupiedBox)
        })

        if (collides)
        {
          continue
        }

        occupiedBoxes.push(labelBox)

        labels.push({
          id: `${featureIndex}-${lineIndex}-${labelIndex}-${streetName}`,
          name: streetName,
          pathId,
          startOffset: `${((distance / pathLength) * 100).toFixed(2)}%`,
          anchorX: Number(anchor.x.toFixed(1)),
          anchorY: Number(anchor.y.toFixed(1)),
        })
      }
    }
  }

  return {
    paths,
    labels,
    featureCount,
    usedRelaxedFallback: relaxedMode,
  }
}

function StreetNameSvgLabels(
  {
    entry,
    labelMinZoom,
    labelMaxCount,
    labelRepeatDistance,
  }:
  {
    entry: StreetsLayerEntry
    labelMinZoom: number
    labelMaxCount: number
    labelRepeatDistance: number
  },
)
{
  const map = useMap()
  const [paths, setPaths] = useState<StreetSvgPath[]>([])
  const [labels, setLabels] = useState<StreetPathLabel[]>([])
  const [zoom, setZoom] = useState(map.getZoom())
  const [mapSize, setMapSize] = useState(map.getSize())

  useEffect(() =>
  {
    if (STREET_LABELS_PROBE_MODE)
    {
      console.log('[street-labels-probe] mounted', entry.id)
    }

    const updateLabels = () =>
    {
      const currentZoom = map.getZoom()
      setZoom(currentZoom)

      if (currentZoom < labelMinZoom)
      {
        setPaths([])
        setLabels([])
        console.log('[street-labels]', entry.id, {
          zoom: currentZoom,
          featureCount: 0,
          generatedLabelCount: 0,
        })
        return
      }

      let result = generateStreetPathLabels(entry.data, map, labelMaxCount, labelRepeatDistance, entry.id, false)

      if (result.labels.length === 0)
      {
        result = generateStreetPathLabels(entry.data, map, labelMaxCount, labelRepeatDistance, entry.id, true)
      }

      setMapSize(map.getSize())
      setPaths(result.paths)
      setLabels(result.labels)

      console.log('[street-labels]', entry.id, {
        zoom: currentZoom,
        featureCount: result.featureCount,
        generatedLabelCount: result.labels.length,
        usedRelaxedFallback: result.usedRelaxedFallback,
      })
    }

    updateLabels()

    map.on('moveend', updateLabels)
    map.on('zoomend', updateLabels)
    map.on('resize', updateLabels)

    return () =>
    {
      map.off('moveend', updateLabels)
      map.off('zoomend', updateLabels)
      map.off('resize', updateLabels)
    }
  }, [entry.data, entry.id, labelMaxCount, labelMinZoom, labelRepeatDistance, map])

  const hasRenderableLabels = !(zoom < labelMinZoom || labels.length === 0 || paths.length === 0)

  if (!hasRenderableLabels && !STREET_LABELS_PROBE_MODE)
  {
    return null
  }

  const portalTarget = map.getContainer()

  return createPortal(
    <svg
      className="street-label-svg"
      width={mapSize.x}
      height={mapSize.y}
      viewBox={`0 0 ${mapSize.x} ${mapSize.y}`}
    >
      <defs>
        {paths.map((path) =>
        {
          return (
            <path
              key={path.id}
              id={path.id}
              d={path.d}
              fill="none"
              stroke={STREET_LABELS_DEBUG_MODE ? 'rgba(255, 0, 0, 0.45)' : 'none'}
              strokeWidth={STREET_LABELS_DEBUG_MODE ? 1.5 : 0}
            />
          )
        })}
      </defs>

      {STREET_LABELS_PROBE_MODE && (
        <g>
          <rect
            x={12}
            y={12}
            width={220}
            height={52}
            fill="rgba(255, 0, 255, 0.15)"
            stroke="rgba(255, 0, 255, 0.9)"
            strokeWidth={1}
          />
          <text
            x={20}
            y={34}
            fill="#b000b0"
            fontSize="13"
            fontWeight="700"
          >
            street labels probe active
          </text>
          <text
            x={20}
            y={52}
            fill="#b000b0"
            fontSize="12"
            fontWeight="600"
          >
            {`${entry.id} z:${zoom} labels:${labels.length}`}
          </text>
        </g>
      )}

      {STREET_LABELS_DEBUG_MODE && labels.map((label) =>
      {
        return (
          <g key={`debug-${label.id}`}>
            <circle cx={label.anchorX} cy={label.anchorY} r={4} fill="red" />
            <text
              x={label.anchorX + 8}
              y={label.anchorY}
              fill="red"
              fontSize="12"
              fontWeight="700"
            >
              {label.name}
            </text>
          </g>
        )
      })}

      {!STREET_LABELS_DEBUG_MODE && labels.map((label) =>
      {
        return (
          <text
            key={label.id}
            className="street-label-svg-text"
          >
            <textPath
              href={`#${label.pathId}`}
              xlinkHref={`#${label.pathId}`}
              startOffset={label.startOffset}
              textAnchor="middle"
            >
              {label.name}
            </textPath>
          </text>
        )
      })}
    </svg>,
    portalTarget,
  )
}
