import React, { useState } from "react";
import { MapContainer } from "react-leaflet";
import { CRS } from "leaflet";
import EventComponent from "./EventComponent";
import MapElements from "./markers/MapElements";
import ResetViewControl from "./ResetViewControl";
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
  
  const maxBounds = [
    [-120, 0],  // south-west [lat, lng]
    [0, 224]    // north-east [lat, lng]
  ];
  const maxBoundsViscosity = 0.9;

  const [currentZoom, setZoomLevel] = useState(initialZoom);
  const updateZoom = (newZoomLevel) => setZoomLevel(newZoomLevel);

  const [coords, setCoords] = useState(initialCenter);
  const updateCoords = (coords) => setCoords(coords);
  const [copyMessage, setCopyMessage] = useState("");

  const copyToClipboard = async (value) =>
  {
    if (navigator.clipboard && navigator.clipboard.writeText)
    {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  const copyZoom = async () =>
  {
    const zoomValue = `Zoom Level: ${currentZoom}`;
    await copyToClipboard(zoomValue);
    setCopyMessage("Copied zoom level");
    setTimeout(() =>
    {
      setCopyMessage("");
    }, 1200);
  };

  const copyCenter = async () =>
  {
    const centerValue = `Center: [${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}]`;
    await copyToClipboard(centerValue);
    setCopyMessage("Copied center coords");
    setTimeout(() =>
    {
      setCopyMessage("");
    }, 1200);
  };

  const renderDebug = () =>
  {
    if (!debug)
    {
      return null;
    }

    return (
      <>
        <div className="zoom-indicator" onClick={copyZoom} title="Click to copy zoom value">
          Zoom Level: {currentZoom}
        </div>
        <div className="coords-indicator" onClick={copyCenter} title="Click to copy center value">
          Center: [{coords[0].toFixed(2)}, {coords[1].toFixed(2)}]
        </div>
        {copyMessage ? <div className="copy-notification">{copyMessage}</div> : null}
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
          maxBounds={maxBounds}
          maxBoundsViscosity={maxBoundsViscosity}
          attributionControl={false}
          className="leaflet-container-custom"
        >
          <MapElements zoom={currentZoom} coords={coords} />
          <EventComponent updateZoom={updateZoom} updateCoords={updateCoords} />
          <ResetViewControl initialCenter={initialCenter} initialZoom={initialZoom} />
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
          maxBounds={maxBounds}
          maxBoundsViscosity={maxBoundsViscosity}
          attributionControl={false}
          className="leaflet-container-custom"
        >
          <MapElements zoom={currentZoom} coords={coords} />
          <EventComponent updateZoom={updateZoom} updateCoords={updateCoords} />
          <ResetViewControl initialCenter={initialCenter} initialZoom={initialZoom} />
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
