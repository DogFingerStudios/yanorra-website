import React, { useState } from "react";
import { AttributionControl, MapContainer } from "react-leaflet";
import { CRS } from "leaflet";
import EventComponent from "./EventComponent";
import MapElements from "./markers/MapElements";

const MapPanel = ({ fullScreen = true }) => 
{
  const ZOOM_LEVELS = 6;
  const STARTING_ZOOM = 3;
  const initialCenter = [-55.94, 111.88];

  const [currentZoom, setZoomLevel] = useState(STARTING_ZOOM);
  const updateZoom = (newZoomLevel) => setZoomLevel(newZoomLevel);

  const [coords, setCoords] = useState(initialCenter);
  const updateCoords = (coords) => setCoords(coords);

  const mapStyle = fullScreen
    ? { height: window.innerHeight, width: window.innerWidth }
    : { height: "100%", width: "100%" };

  return (
    <div className={fullScreen ? "map-panel-fullscreen" : "map-panel-side"}>
      <MapContainer
        center={initialCenter}
        minZoom={3}
        zoom={currentZoom}
        scrollWheelZoom={true}
        style={mapStyle}
        crs={CRS.Simple}
        maxZoom={ZOOM_LEVELS}
        attributionControl={false}
        className="leaflet-container-custom"
      >
        <MapElements zoom={currentZoom} coords={coords} />
        <EventComponent updateZoom={updateZoom} updateCoords={updateCoords} />
        <AttributionControl
          position={"bottomright"}
          prefix={"Icons from Game-icons.net"}
        />
      </MapContainer>
      {fullScreen && (
        <>
          <div className="zoom-indicator">
            Zoom Level: {currentZoom}
          </div>
          <div className="coords-indicator">
            Center: [{coords[0].toFixed(2)}, {coords[1].toFixed(2)}]
          </div>
        </>
      )}
    </div>
  );
};

export default MapPanel;
