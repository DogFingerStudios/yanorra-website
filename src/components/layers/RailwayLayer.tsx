import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-polylinedecorator'
import './Routes.css'

const RAILWAY_TIE_REPEAT = 18
const RAILWAY_TIE_SIZE = 9

type RailwayLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
}

export function getRailwayLayer(entry: RailwayLayerEntry)
{
  const styleFeature = () =>
  {
    return {
      color: '#4f4f4f',
      weight: 2.4,
      opacity: 0.95,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    }
  }

  const onEachFeatureHandler = (feature: GeoJSON.Feature, layer: L.Layer) =>
  {
    const properties = feature.properties

    if (!properties)
    {
      return
    }

    const routeName = properties.name

    if (typeof routeName !== 'string' || routeName.trim() === '')
    {
      return
    }

    const tooltipLayer = layer as L.Layer &
    {
      bindTooltip?: (content: string, options?: L.TooltipOptions) => L.Layer
    }

    if (typeof tooltipLayer.bindTooltip === 'function')
    {
      tooltipLayer.bindTooltip(routeName, {
        permanent: false,
        direction: 'top',
        opacity: 0.9,
        className: 'route-label-tooltip',
      })
    }
  }

  const isLineLayer = (layer: L.Layer): layer is L.Polyline =>
  {
    if (layer instanceof L.Polygon)
    {
      return false
    }

    if (layer instanceof L.Polyline)
    {
      return true
    }

    return false
  }

  const RailwayLayer = () =>
  {
    const map = useMap()

    useEffect(() =>
    {
      const railwayLayer = L.geoJSON(entry.data, {
        style: styleFeature,
        onEachFeature: onEachFeatureHandler,
      })
      const railwayLines: L.Polyline[] = []

      railwayLayer.eachLayer((layer) =>
      {
        if (isLineLayer(layer))
        {
          railwayLines.push(layer)
        }
      })

      const combinedLayer = L.layerGroup()
      combinedLayer.addLayer(railwayLayer)

      if (railwayLines.length > 0)
      {
        const railwayTies = L.polylineDecorator(railwayLines, {
          patterns: [
            {
              offset: 0,
              repeat: RAILWAY_TIE_REPEAT,
              symbol: L.Symbol.dash({
                pixelSize: RAILWAY_TIE_SIZE,
                pathOptions: {
                  color: '#f3ede2',
                  weight: 1.6,
                  opacity: 0.95,
                  lineCap: 'square',
                },
              }),
            },
          ],
        })

        combinedLayer.addLayer(railwayTies)
      }

      combinedLayer.addTo(map)

      return () =>
      {
        map.removeLayer(combinedLayer)
      }
    }, [map])

    return null
  }

  return <RailwayLayer key={entry.id} />
}