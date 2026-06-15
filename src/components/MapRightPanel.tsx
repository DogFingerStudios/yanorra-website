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

type ToogleGroupContainer = 
{
    id: string;
    label: string;
    groupIds: readonly string[];
}

type MapRightPanelProps =
{
    baseLayers: LayerOption[]
    selectedBaseLayer: string
    onBaseLayerChange: (layer: string) => void
    optionalLayers: ToggleGroup[]
    onOptionalLayerChange: (layer: string, isChecked: boolean) => void,
    toggleGroupContainers: ToogleGroupContainer[]
}

const MapRightPanel = ({ baseLayers, selectedBaseLayer, onBaseLayerChange, optionalLayers, onOptionalLayerChange, toggleGroupContainers }: MapRightPanelProps) =>
{
    const [isOpen, setIsOpen] = useState(false)
    const togglePanel = () => setIsOpen(!isOpen)

    const renderOptionalLayer = (layer: ToggleGroup) =>
    {
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
    }

    console.log("Toggle group containers:", toggleGroupContainers)

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

                {
                    toggleGroupContainers.map((container) =>
                    {
                        return (
                            <div key={container.id} className="map-right-panel-section">
                                <div className="map-right-panel-section-title">{container.label}</div>
                                {container.groupIds.map((groupId) =>
                                {
                                    const group = optionalLayers.find((g) => g.id === groupId)
                                    if (!group)
                                    {
                                        console.warn(`Group with id ${groupId} not found for container ${container.id}`)
                                        return null
                                    }
                                    return renderOptionalLayer(group)
                                })}
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default MapRightPanel
