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

    const population = properties.Population
    if (zoom <= 4 && population < 5000)
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
    if (!properties)
    {
      return
    }

    const population = properties.Population
    if (zoom <= 4 && population < 5000)
    {
      return
    }
    
    return L.circleMarker(latlng, {
      radius: 4,
      color: '#000000',
      weight: 1,
      fillColor: '#000000',
      fillOpacity: 1,
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