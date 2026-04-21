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
}

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
        return
      }

      const stateName = properties.State

      if (typeof stateName !== 'string' || stateName.trim() === '')
      {
        return
      }

      const featureLayer = L.geoJSON(feature)
      const featureBounds = featureLayer.getBounds()

      if (!featureBounds.isValid())
      {
        return
      }

      nextLabelData.push({
        id: `${entry.id}-${index}`,
        stateName,
        bounds: featureBounds,
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
      if (!viewBounds.intersects(label.bounds))
      {
        return null
      }

      const visibleSouth = Math.max(viewBounds.getSouth(), label.bounds.getSouth())
      const visibleNorth = Math.min(viewBounds.getNorth(), label.bounds.getNorth())
      const visibleWest = Math.max(viewBounds.getWest(), label.bounds.getWest())
      const visibleEast = Math.min(viewBounds.getEast(), label.bounds.getEast())

      if (visibleSouth > visibleNorth || visibleWest > visibleEast)
      {
        return null
      }

      const centerLat = (visibleSouth + visibleNorth) / 2
      const centerLng = (visibleWest + visibleEast) / 2

      return {
        id: label.id,
        stateName: label.stateName,
        center: L.latLng(centerLat, centerLng),
      }
    })
    .filter((value): value is { id: string, stateName: string, center: L.LatLng } =>
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