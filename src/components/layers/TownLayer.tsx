import { GeoJSON, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import './TownLayer.css'

type TownLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
}

export function getTownLayer(entry: TownLayerEntry)
{
  return <TownLayer entry={entry} />
}

function getTownPopulation(properties: GeoJSON.GeoJsonProperties): number | null
{
  const population = properties?.Population

  if (typeof population === 'number' && Number.isFinite(population))
  {
    return population
  }

  if (typeof population === 'string')
  {
    const parsedPopulation = Number(population)

    if (Number.isFinite(parsedPopulation))
    {
      return parsedPopulation
    }
  }

  return null
}

function shouldShowTown(properties: GeoJSON.GeoJsonProperties, zoom: number): boolean
{
  const maxZoom = properties?.MaxZoom;
  const minZoom = properties?.MinZoom;

  // print the town's name, maxzoom, minzoom, population, and current zoom level for debugging
  const burgName = properties?.Burg ?? 'Unknown'
  const population2 = getTownPopulation(properties) ?? 'Unknown'
  console.log(`Evaluating town "${burgName}" with population ${population2}, maxZoom: ${maxZoom}, minZoom: ${minZoom} at current zoom level ${zoom}`)

  if (typeof maxZoom === 'number' && typeof minZoom == 'number')
  {
    return zoom >= minZoom && zoom <= maxZoom;
  }
  else if (typeof maxZoom === 'number' && zoom > maxZoom)
  {
    return false
  }
  else if (typeof minZoom === 'number' && zoom < minZoom)
  {
    return false
  }

  const population = getTownPopulation(properties)
  if (population === null)
  {
    return true
  }

  switch (zoom)
  {
    case 0:
    case 1:
    case 2:
      return population >= 500000
    case 3:
    case 4:
    case 5:
      return population >= 100000
    case 6:
      return population >= 5000
    case 7:
    case 8:
    case 9:
      return population >= 1000
    case 10:
    case 11:
    case 12:
      return population >= 500
    default:
      return true
  }
}

function TownLayer({ entry }: { entry: TownLayerEntry })
{
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

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

  const onEachFeatureHandler = (feature: GeoJSON.Feature, layer: L.Layer) =>
  {
    const properties = feature.properties

    if (!properties)
    {
      return
    }

    const burgName = properties.Burg
    if (typeof burgName !== 'string' || burgName.trim() === '')
    {
      return
    }
    
    if (!shouldShowTown(properties, zoom))
    {
      return
    }

    const tooltipLayer = layer as L.Layer &
    {
      bindTooltip?: (content: string, options?: L.TooltipOptions) => L.Layer
    }

    if (typeof tooltipLayer.bindTooltip === 'function')
    {
      tooltipLayer.bindTooltip(burgName, {
        permanent: true,
        direction: 'top',
        offset: L.point(0, -8),
        opacity: 0.9,
        className: 'town-label-tooltip',
      })
    }
  }

  const pointToLayerHandler = (_feature: GeoJSON.Feature, latlng: L.LatLng) =>
  {
    const properties = _feature.properties
    const isVisible = shouldShowTown(properties, zoom)

    return L.circleMarker(latlng, {
      radius: isVisible ? 4 : 0,
      color: '#000000',
      weight: 1,
      fillColor: '#000000',
      fillOpacity: isVisible ? 1 : 0,
      opacity: isVisible ? 1 : 0,
      interactive: isVisible,
    })
  }

  return (
    <GeoJSON
      key={`${entry.id}-${zoom}`}
      data={entry.data}
      onEachFeature={onEachFeatureHandler}
      pointToLayer={pointToLayerHandler}
    />
  )
}