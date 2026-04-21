import { GeoJSON } from 'react-leaflet'
import L from 'leaflet'

type TownLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
}

export function getTownLayer(entry: TownLayerEntry)
{
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
      })
    }
  }

  const pointToLayerHandler = (_feature: GeoJSON.Feature, latlng: L.LatLng) =>
  {
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
      key={entry.id}
      data={entry.data}
      onEachFeature={onEachFeatureHandler}
      pointToLayer={pointToLayerHandler}
    />
  )
}