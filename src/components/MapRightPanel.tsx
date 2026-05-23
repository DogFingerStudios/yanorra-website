import { useState } from 'react'
import './MapRightPanel.css'

type BaseLayerKey = 'land' | 'biomes'

type MapRightPanelProps =
{
  selectedBaseLayer: BaseLayerKey
  onBaseLayerChange: (layer: BaseLayerKey) => void
}

const MapRightPanel = ({ selectedBaseLayer, onBaseLayerChange }: MapRightPanelProps) =>
{
  const [isOpen, setIsOpen] = useState(false)

  function togglePanel()
  {
    setIsOpen(!isOpen)
  }

  return (
    <div className={`map-right-panel${isOpen ? ' map-right-panel--open' : ''}`}>
      <button
        className="map-right-panel-tab"
        onClick={togglePanel}
        aria-label={isOpen ? 'Close panel' : 'Open panel'}
        title={isOpen ? 'Close panel' : 'Open panel'}
      >
        {isOpen ? '▶' : '◀'}
      </button>
      <div className="map-right-panel-content">
        <div className="map-right-panel-section">
          <div className="map-right-panel-section-title">Base Layer</div>
          <label className="map-right-panel-radio-label">
            <input
              type="radio"
              name="base-layer"
              value="land"
              checked={selectedBaseLayer === 'land'}
              onChange={() => onBaseLayerChange('land')}
            />
            Land
          </label>
          <label className="map-right-panel-radio-label">
            <input
              type="radio"
              name="base-layer"
              value="biomes"
              checked={selectedBaseLayer === 'biomes'}
              onChange={() => onBaseLayerChange('biomes')}
            />
            Biomes
          </label>
        </div>
      </div>
    </div>
  )
}

export default MapRightPanel
