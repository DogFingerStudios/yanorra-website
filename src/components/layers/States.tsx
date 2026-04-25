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

export function getStatesLayer(entry: StatesLayerEntry)
{
  return <StatesLayer entry={entry} />
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

// function drawDynamicLabel(label: StateLabelDatum, viewBounds: L.LatLngBounds): VisibleStateLabel | null
// {
//   if (!viewBounds.intersects(label.bounds))
//   {
//     return null
//   }

//   const visibleSouth = Math.max(viewBounds.getSouth(), label.bounds.getSouth())
//   const visibleNorth = Math.min(viewBounds.getNorth(), label.bounds.getNorth())
//   const visibleWest = Math.max(viewBounds.getWest(), label.bounds.getWest())
//   const visibleEast = Math.min(viewBounds.getEast(), label.bounds.getEast())

//   if (visibleSouth > visibleNorth || visibleWest > visibleEast)
//   {
//     return null
//   }

//   const centerLat = (visibleSouth + visibleNorth) / 2
//   const centerLng = (visibleWest + visibleEast) / 2

//   return {
//     id: label.id,
//     stateName: label.stateName,
//     center: L.latLng(centerLat, centerLng),
//   }
// }

function StatesLayer({ entry }: { entry: StatesLayerEntry })
{
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

      if (!properties)
      {
        console.log("Feature is missing properties, skipping label generation")
        return
      }

      const stateName = properties.Data_State
      if (typeof stateName !== 'string' || stateName.trim() === '')
      {
        console.log("Feature is missing state name, skipping label generation")
        return
      }

      const featureLayer = L.geoJSON(feature)
      const featureBounds = featureLayer.getBounds()

      if (!featureBounds.isValid())
      {
        console.log("Feature has invalid bounds, skipping label generation")
        return
      }

      const labelLong = parseFiniteNumber(properties.Label_Longitude)
      const labelLat = parseFiniteNumber(properties.Label_Latitude)
      
      // print out properties.Label_Latitude and properties.Label_Longitude for debugging
      console.log(`Feature ${index} - Label_Latitude: ${properties.Label_Latitude}, Label_Longitude: ${properties.Label_Longitude}`)

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
      return null;
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
          <CircleMarker key={label.id} center={label.center} radius={0} stroke={false} fill={false} interactive={false}>
            <Tooltip permanent direction="center" opacity={0.9} interactive={false} className="state-label-tooltip">
              {label.stateName}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}