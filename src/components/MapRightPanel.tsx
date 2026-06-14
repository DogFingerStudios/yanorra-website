import { useState } from 'react'
import './MapRightPanel.css'

type LayerOption =
{
    id: string
    label: string
}

type ToggleGroup = 
{
    id: string;
    label: string;
    visible: boolean;
    layerIds: readonly string[];
};


type MapRightPanelProps =
{
    baseLayers: LayerOption[]
    selectedBaseLayer: string
    onBaseLayerChange: (layer: string) => void
    optionalLayers: ToggleGroup[]
    onOptionalLayerChange: (layer: string, isChecked: boolean) => void
}

const MapRightPanel = ({ baseLayers, selectedBaseLayer, onBaseLayerChange, optionalLayers, onOptionalLayerChange }: MapRightPanelProps) =>
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
            <div className="map-right-panel-section-title">
                Base Layer
            </div>
            {baseLayers.map((layer) =>
            {
              return (
                <label key={layer.id} className="map-right-panel-radio-label">
                <input
                    type="radio"
                    name="base-layer"
                    value={layer.id}
                    checked={selectedBaseLayer === layer.id}
                    onChange={() => onBaseLayerChange(layer.id)}
                />
                {layer.label}
                </label>
              )
            })}
        </div>

        <div className="map-right-panel-section">
            <div className="map-right-panel-section-title">
                Places</div>
            {optionalLayers.map((layer) =>
            {
              // console.log('Rendering optional layer:', layer.id)
              return (
                <label key={layer.id} className="map-right-panel-radio-label">
                <input
                    type="checkbox"
                    name={layer.id}
                    checked={layer.visible}
                  onChange={(event) => onOptionalLayerChange(layer.id, event.currentTarget.checked)}
                />
                {layer.label}
                </label>
              )
            })}
        </div>
    </div>
</div>
  )
}

export default MapRightPanel
