import { useNavigate } from 'react-router-dom'
import MapPanel from './MapPanel'
import './MapFullScreen.css'

const MapFullScreen = () =>
{
  const navigate = useNavigate()

  return (
    <div className="map-fullscreen-container">
      <div className="map-sidebar">
        <button 
          className="close-button"
          onClick={() => navigate('/')}
          aria-label="Close map"
          title="Close map"
        >
          ✕
        </button>
      </div>
      <div className="map-main">
        <MapPanel fullScreen={true} />
      </div>
    </div>
  )
}

export default MapFullScreen
