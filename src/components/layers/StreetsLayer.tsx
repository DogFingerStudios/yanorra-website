import { GeoJSON } from 'react-leaflet'
import './BuildingsLayer.css'

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
  }
}

export function getStreetsLayer(entry: StreetsLayerEntry)
{
  const styleFeature = () =>
  {
    const baseColor = entry.options.color ?? '#cbd8bf'

    return {
      color: baseColor,
      fillColor: entry.options.fillColor ?? baseColor,
      weight: entry.options.weight ?? 1,
      fillOpacity: entry.options.fillOpacity ?? 1,
      opacity: 1,
    }
  }

  return (
    <GeoJSON
      key={entry.id}
      data={entry.data}
      style={styleFeature}
    />
  )
}


// import { useEffect, useState } from 'react'
// import { GeoJSON, useMapEvents } from 'react-leaflet'
// import './Routes.css'

// type StreetsLayerEntry =
// {
//   id: string
//   data: GeoJSON.GeoJsonObject
//   options:
//   {
//     color?: string
//     weight?: number
//   }
// }

// export function getStreetsLayer(entry: StreetsLayerEntry)
// {
//   const getUniformStreetWeight = (zoom: number) =>
//   {
//     let retval = 8;
//     if (zoom <= 8)
//     {
//       retval = 1
//     }
//     else if (zoom <= 11)
//     {
//       retval = 1.5
//     }
//     else if (zoom <= 13)
//     {
//       retval = 5.2
//     }
//     else if (zoom <= 15)
//     {
//       retval = 6.6
//     }

//     // console.debug(`Zoom ${zoom} - using base street weight ${retval}`)
//     return retval;
//   }

//   const StreetsGeoJson = () =>
//   {
//     const [currentZoom, setCurrentZoom] = useState(5)

//     const map = useMapEvents({
//       zoomend: () =>
//       {
//         setCurrentZoom(map.getZoom())
//       },
//     })

//     useEffect(() =>
//     {
//       setCurrentZoom(map.getZoom())
//     }, [map])

//     const getStreetStyle = (feature: GeoJSON.Feature, stylePass: 'casing' | 'fill') =>
//     {
//       const baseWeight = getUniformStreetWeight(currentZoom)
//       const properties = feature.properties

//       // Use this block to style specific roads later by feature properties.
//       // Example fields often available: name, class, type, category.
//       let roadColor = '#ffffff'
//       let roadWeight = baseWeight

//       if (properties && typeof properties === 'object')
//       {
//         // Example: make a specific road wider.
//         // if (properties.name === 'West 2nd Avenue')
//         // {
//         //   roadWeight = baseWeight * 1.35
//         // }

//         // Example: recolor one road class.
//         // if (properties.class === 'major')
//         // {
//         //   roadColor = '#f2d589'
//         // }
//       }

//       if (stylePass === 'casing')
//       {
//         return {
//           // color: '#dfdddb',
//           color: '#000000',
//           weight: roadWeight + 1.6,
//           opacity: 1,
//           lineCap: 'round' as const,
//           lineJoin: 'round' as const,
//         }
//       }

//       let fallbackColor = '#ffff00'

//       if (entry.options.color)
//       {
//         fallbackColor = entry.options.color
//       }

//       let finalColor = roadColor

//       if (finalColor === '#f7f7f5')
//       {
//         finalColor = fallbackColor
//       }

//       return {
//         color: finalColor,
//         weight: roadWeight,
//         opacity: 1,
//         lineCap: 'round' as const,
//         lineJoin: 'round' as const,
//       }
//     }

//     return (
//       <>
//         <GeoJSON
//           key={`${entry.id}-casing`}
//           data={entry.data}
//           style={(feature) =>
//           {
//             if (!feature)
//             {
//               return {}
//             }

//             return getStreetStyle(feature, 'casing')
//           }}
//         />
//         <GeoJSON
//           key={`${entry.id}-fill`}
//           data={entry.data}
//           style={(feature) =>
//           {
//             if (!feature)
//             {
//               return {}
//             }

//             return getStreetStyle(feature, 'fill')
//           }}
//         />
//       </>
//     )
//   }

//   return <StreetsGeoJson key={entry.id} />
// }