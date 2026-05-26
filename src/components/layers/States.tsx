import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, GeoJSON, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import './States.css'

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

type Coordinate = [number, number]

type BorderSegment =
{
  count: number
  coordinates: [Coordinate, Coordinate]
}

export function getStatesLayer(entry: StatesLayerEntry)
{
  return <StatesLayer entry={entry} showColors={false} />
}

export function getStatesColorsLayer(entry: StatesLayerEntry)
{
  return <StatesLayer entry={entry} showColors={true} />
}

type StateLabelDatum =
{
  id: string
  stateName: string
  bounds: L.LatLngBounds
  fixedCenter: L.LatLng | null
}

type VisibleStateLabel =
{
  id: string
  stateName: string
  center: L.LatLng
}

function parseFiniteNumber(value: unknown): number | null
{
  if (typeof value === 'number' && Number.isFinite(value))
  {
    return value
  }

  if (typeof value === 'string')
  {
    const parsedValue = Number(value)

    if (Number.isFinite(parsedValue))
    {
      return parsedValue
    }
  }

  return null
}

function coordinateKey(coordinate: Coordinate): string
{
  const x = Number(coordinate[0]).toFixed(6)
  const y = Number(coordinate[1]).toFixed(6)

  return `${x},${y}`
}

function segmentKey(a: Coordinate, b: Coordinate): string
{
  const aKey = coordinateKey(a)
  const bKey = coordinateKey(b)

  if (aKey < bKey)
  {
    return `${aKey}|${bKey}`
  }

  return `${bKey}|${aKey}`
}

function addRingSegments(ring: Coordinate[], segments: Map<string, BorderSegment>)
{
  for (let index = 0; index < ring.length - 1; index++)
  {
    const a = ring[index]
    const b = ring[index + 1]
    const key = segmentKey(a, b)

    const existingSegment = segments.get(key)

    if (existingSegment)
    {
      existingSegment.count += 1
      continue
    }

    segments.set(key, {
      count: 1,
      coordinates: [a, b],
    })
  }
}

function buildInternalStateBorders(data: GeoJSON.GeoJsonObject): GeoJSON.FeatureCollection
{
  const featureCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  if (data.type !== 'FeatureCollection')
  {
    return featureCollection
  }

  const sourceFeatureCollection = data as GeoJSON.FeatureCollection
  const segments = new Map<string, BorderSegment>()

  sourceFeatureCollection.features.forEach((feature: GeoJSON.Feature) =>
  {
    if (!feature.geometry)
    {
      return
    }

    if (feature.geometry.type === 'Polygon')
    {
      const polygon = feature.geometry.coordinates as Coordinate[][]

      polygon.forEach((ring) =>
      {
        addRingSegments(ring, segments)
      })
    }

    if (feature.geometry.type === 'MultiPolygon')
    {
      const multiPolygon = feature.geometry.coordinates as Coordinate[][][]

      multiPolygon.forEach((polygon) =>
      {
        polygon.forEach((ring) =>
        {
          addRingSegments(ring, segments)
        })
      })
    }
  })

  const internalBorderLines: Coordinate[][] = []

  segments.forEach((segment) =>
  {
    if (segment.count >= 2)
    {
      internalBorderLines.push(segment.coordinates)
    }
  })

  featureCollection.features.push({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiLineString',
      coordinates: internalBorderLines,
    },
  })

  return featureCollection
}

function drawFixedLabel(label: StateLabelDatum, viewBounds: L.LatLngBounds): VisibleStateLabel | null
{
  if (!label.fixedCenter)
  {
    return null
  }

  if (!viewBounds.contains(label.fixedCenter))
  {
    return null
  }

  return {
    id: label.id,
    stateName: label.stateName,
    center: label.fixedCenter,
  }
}

function getFeatureStateName(feature: GeoJSON.Feature): string | null
{
  const properties = feature.properties as Record<string, unknown> | null | undefined

  if (!properties)
  {
    return null
  }

  const rawStateName = properties.Data_State

  if (typeof rawStateName !== 'string')
  {
    return null
  }

  const normalizedStateName = rawStateName.trim()

  if (normalizedStateName === '')
  {
    return null
  }

  return normalizedStateName
}

function getBorderWeight(baseWeight: number | undefined, zoom: number): number
{
  let retval = baseWeight ?? 1

  if (zoom <= 3)
  {
    retval *= 1.15
  }
  else if (zoom <= 5)
  {
    retval *= 1.3
  }
  else if (zoom <= 7)
  {
    retval *= 1.85
  }
  else if (zoom <= 11)
  {
    retval *= 2.85
  }
  else
  {
    retval *= 3.6
  }

  return retval
}

function StatesLayer({ entry, showColors }: { entry: StatesLayerEntry, showColors: boolean   })
{
  const [currentZoom, setCurrentZoom] = useState(5)
  const [hoveredStateName, setHoveredStateName] = useState<string | null>(null)

  const map = useMapEvents(
  {
    zoomend: () => 
    {
      setCurrentZoom(map.getZoom())
    },
  })

  useEffect(() => 
  {
      setCurrentZoom(map.getZoom())
  }, [map])

  const internalBorders = useMemo(() => 
  {
      return buildInternalStateBorders(entry.data)
  }, [entry.data])

  const labelData = useMemo(() =>
  {
    const data = entry.data
    const nextLabelData: StateLabelDatum[] = []

    if (data.type !== 'FeatureCollection')
    {
      return nextLabelData
    }

    const featureCollection = data as GeoJSON.FeatureCollection

      featureCollection.features.forEach((feature: GeoJSON.Feature, index: number) => 
      {
        const properties = feature.properties

        if (properties?.visible != null && properties.visible === false)
        {
            return
        }

        if (!properties) 
        {
            console.log('Feature is missing properties, skipping label generation')
            return
        }

        const stateName = properties.Data_State
        if ((typeof stateName !== 'string' || stateName.trim() === '') && properties.type !== "island") 
        {
            console.warn('Feature is missing state name. Feature:', feature, "Properties:", properties)
            return
        }

        const featureLayer = L.geoJSON(feature)
        const featureBounds = featureLayer.getBounds()

        if (!featureBounds.isValid()) 
        {
            console.log('Feature has invalid bounds, skipping label generation')
            return
        }

        const labelLong = parseFiniteNumber(properties.Label_Longitude)
        const labelLat = parseFiniteNumber(properties.Label_Latitude)

        let fixedCenter: L.LatLng | null = null

        if (labelLong !== null && labelLat !== null) 
        {
            fixedCenter = L.latLng(labelLat, labelLong)
        }

        nextLabelData.push({
            id: `${entry.id}-${index}`,
            stateName,
            bounds: featureBounds,
            fixedCenter,
        })
    })

    return nextLabelData
  }, [entry.data, entry.id])

  return (
    <>
      <GeoJSON
        key={`${entry.id}-fills`}
        data={entry.data}
        style={(feature) =>
        {
          let fillOpacity = entry.options.fillOpacity
          let fillColor = entry.options.fillColor

          if (feature)
          {
            const featureStateName = getFeatureStateName(feature)
            const featureColor = feature.properties?.Data_Color

            if (typeof featureColor === 'string' && featureColor.trim() !== '')
            {
              fillColor = featureColor
            }

            if (showColors)
            {
              fillColor = feature.properties?.Data_Color 
              fillOpacity = 0.35
            }

            if (featureStateName && featureStateName === hoveredStateName)
            {
              fillColor = showColors ? feature.properties?.Data_Color : '#F0F4F8'
              if ((fillOpacity ?? 0) < 0.65)
              {
                fillOpacity = 0.65
              }
            }
          }

          return {
            stroke: false,
            fillColor,
            fillOpacity,
          }
        }}

        onEachFeature={(feature, layer) =>
        {
          layer.on({
            mouseover: () =>
            {
              const featureStateName = getFeatureStateName(feature)
              if (!featureStateName)
              {
                return
              }

              setHoveredStateName(featureStateName)
            },
            mouseout: () =>
            {
              setHoveredStateName(null)
            },
          })
        }}
      />

      <GeoJSON
        key={`${entry.id}-internal-borders`}
        data={internalBorders}
        style={() =>
        {
          return {
            color: entry.options.color,
            weight: getBorderWeight(entry.options.weight, currentZoom),
            opacity: 1,
            fillOpacity: 0,
            interactive: false,
          }
        }}
      />

      <StateViewportLabels labelData={labelData} />
    </>
  )
}

function StateViewportLabels({ labelData }: { labelData: StateLabelDatum[] })
{
  const [viewBounds, setViewBounds] = useState<L.LatLngBounds | null>(null)

  const map = useMapEvents({
    zoomend: () =>
    {
      setViewBounds(map.getBounds())
    },
    moveend: () =>
    {
      setViewBounds(map.getBounds())
    },
  })

  useEffect(() =>
  {
    setViewBounds(map.getBounds())
  }, [map])

  if (!viewBounds)
  {
    return null
  }

  const visibleLabels = labelData
    .map((label) =>
    {
      const fixedLabel = drawFixedLabel(label, viewBounds)

      if (fixedLabel)
      {
        return fixedLabel
      }

      // return drawDynamicLabel(label, viewBounds)
      return null
    })
    .filter((value): value is VisibleStateLabel =>
    {
      if (value)
      {
        return true
      }

      return false
    })

  return (
    <>
      {visibleLabels.map((label) =>
      {
        return (
          <CircleMarker
            key={label.id}
            center={label.center}
            radius={0}
            stroke={false}
            fill={false}
            interactive={false}
          >
            <Tooltip
              permanent
              direction="center"
              opacity={0.9}
              interactive={false}
              className="state-label-tooltip"
            >
              {label.stateName}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}
