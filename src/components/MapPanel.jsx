import React, { useState } from "react";
import { AttributionControl, MapContainer } from "react-leaflet";
import { CRS } from "leaflet";
import EventComponent from "./EventComponent";
import MapElements from "./markers/MapElements";
import 'leaflet/dist/leaflet.css'

const MapPanel = ({ 
  fullScreen = true, 
  initialZoom = 3, 
  initialCenter = [-55.94, 111.88],
  minZoom = 3,
  maxZoom = 6,
  scrollWheelZoom = true,
  debug = false
}) => 
{
  console.log('MapPanel rendered with:', { fullScreen, initialZoom, initialCenter, minZoom, maxZoom, scrollWheelZoom, debug });
  
  const [currentZoom, setZoomLevel] = useState(initialZoom);
  const updateZoom = (newZoomLevel) => setZoomLevel(newZoomLevel);

  const [coords, setCoords] = useState(initialCenter);
  const updateCoords = (coords) => setCoords(coords);

  const renderDebug = () =>
  {
    if (!debug)
    {
      return null;
    }

    return (
      <>
        <div className="zoom-indicator">
          Zoom Level: {currentZoom}
        </div>
        <div className="coords-indicator">
          Center: [{coords[0].toFixed(2)}, {coords[1].toFixed(2)}]
        </div>
      </>
    );
  };

  const renderFullscreen = () => 
  {
    const mapStyle = { height: "100%", width: "100%" };

    return (
      <div className="map-panel-fullscreen">
        <MapContainer
          key={`map-${initialCenter[0]}-${initialCenter[1]}-${initialZoom}`}
          center={initialCenter}
          minZoom={minZoom}
          zoom={initialZoom}
          scrollWheelZoom={scrollWheelZoom}
          style={mapStyle}
          crs={CRS.Simple}
          maxZoom={maxZoom}
          attributionControl={false}
          className="leaflet-container-custom"
        >
          <MapElements zoom={currentZoom} coords={coords} />
          <EventComponent updateZoom={updateZoom} updateCoords={updateCoords} />
          {/* <AttributionControl
            position={"bottomright"}
            prefix={"Icons from Game-icons.net"}
          /> */}
        </MapContainer>
        {renderDebug()}
      </div>
    );
  };

  const renderEmbedded = () => 
  {
    const mapStyle = { height: "100%", width: "100%" };
    
    return (
      <div className="map-panel-side">
        <MapContainer
          key={`map-${initialCenter[0]}-${initialCenter[1]}-${initialZoom}`}
          center={initialCenter}
          minZoom={minZoom}
          zoom={initialZoom}
          scrollWheelZoom={scrollWheelZoom}
          style={mapStyle}
          crs={CRS.Simple}
          maxZoom={maxZoom}
          attributionControl={false}
          className="leaflet-container-custom"
        >
          <MapElements zoom={currentZoom} coords={coords} />
          <EventComponent updateZoom={updateZoom} updateCoords={updateCoords} />
          {/* <AttributionControl
            position={"bottomright"}
            prefix={"Icons from Game-icons.net"}
          /> */}
        </MapContainer>
        {renderDebug()}
      </div>
    );
  };

  const renderPanel = () => 
  {
    if (fullScreen)
    {
      return renderFullscreen();
    }

    return renderEmbedded();
  };

  return renderPanel();
};

export default MapPanel;
