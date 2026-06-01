import { GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import './Routes.css'

type RoutesLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options:
  {
    id?: string
    color?: string
    weight?: number
  }
}

export function getRoutesLayer(entry: RoutesLayerEntry)
{
    const styleFeature = (_feature?: GeoJSON.Feature) =>
    {
        // const properties = feature?.properties
        let routeColor: string | undefined
        let routeWeight: number | undefined
        let routeDashArray: string | undefined
        let routeOpacity: number | undefined
        let lineCap: L.LineCapShape | undefined
        let lineJoin: L.LineJoinShape | undefined

        if (typeof entry.options.id === 'string' && entry.options.id.trim() !== '')
        {
            switch (entry.options.id)
            {
                case 'roads_highway':
                case 'roads_major':
                    routeColor = '#ffb47f'
                    routeWeight = 3
                    routeOpacity = 1
                    lineCap = 'square'
                    lineJoin = 'round'
                break
            }
        }

        routeColor = routeColor ?? entry.options.color
        routeWeight = routeWeight ?? entry.options.weight

        return {
            color: routeColor ?? entry.options.color,
            weight: routeWeight ?? entry.options.weight,
            dashArray: routeDashArray,
            opacity: routeOpacity ?? 1,
            lineCap: lineCap ?? 'round' as const,
            lineJoin: lineJoin ?? 'round' as const,
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

    return (
        <GeoJSON
        key={entry.id}
        data={entry.data}
        style={styleFeature}
        onEachFeature={onEachFeatureHandler}
        />
    )
}
