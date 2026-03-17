import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MapPanel from './MapPanel'
import './MapFullScreen.css'

const MapFullScreen = () =>
{
  const navigate = useNavigate()
  const location = useLocation()

  const initialMapView = useMemo(() =>
  {
    const defaultZoom = 3
    const defaultCenter = [-55.94, 111.88]
    const minZoom = 3
    const maxZoom = 6
    const minLat = -120
    const maxLat = 0
    const minLng = 0
    const maxLng = 224

    const searchParams = new URLSearchParams(location.search)
    const requestedZoom = Number(searchParams.get('z'))
    const requestedLat = Number(searchParams.get('lat'))
    const requestedLng = Number(searchParams.get('lng'))

    let resolvedZoom = defaultZoom
    if (!Number.isNaN(requestedZoom))
    {
      if (requestedZoom < minZoom)
      {
        resolvedZoom = minZoom
      }
      else if (requestedZoom > maxZoom)
      {
        resolvedZoom = maxZoom
      }
      else
      {
        resolvedZoom = requestedZoom
      }
    }

    let resolvedLat = defaultCenter[0]
    if (!Number.isNaN(requestedLat))
    {
      if (requestedLat < minLat)
      {
        resolvedLat = minLat
      }
      else if (requestedLat > maxLat)
      {
        resolvedLat = maxLat
      }
      else
      {
        resolvedLat = requestedLat
      }
    }

    let resolvedLng = defaultCenter[1]
    if (!Number.isNaN(requestedLng))
    {
      if (requestedLng < minLng)
      {
        resolvedLng = minLng
      }
      else if (requestedLng > maxLng)
      {
        resolvedLng = maxLng
      }
      else
      {
        resolvedLng = requestedLng
      }
    }

    return {
      zoom: resolvedZoom,
      center: [resolvedLat, resolvedLng]
    }
  }, [location.search])

  return (
    <div className="map-fullscreen-container">
      <div className="map-sidebar">
        <div className="map-sidebar-top">
          {[1, 2, 3].map((num) => (
            <button 
              key={num}
              className="numbered-button"
            >
              {num}
            </button>
          ))}
        </div>
        <div className="map-sidebar-bottom">
          <button 
            className="close-button"
            onClick={() => navigate('/')}
            aria-label="Close map"
            title="Close map"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="map-main">
        <MapPanel
          fullScreen={true}
          initialZoom={initialMapView.zoom}
          initialCenter={initialMapView.center}
        />
      </div>
    </div>
  )
}

export default MapFullScreen
