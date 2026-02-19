import React, { useState } from "react";
import { CircleMarker, Polyline, MapContainer } from "react-leaflet";
import { CRS } from "leaflet";
import EventComponent from "./EventComponent";
import MapElements from "./markers/MapElements";
import ResetViewControl from "./ResetViewControl";
import MeasureDistanceControl from "./MeasureDistanceControl";
import FullScreenLinkControl from "./FullScreenLinkControl";
import 'leaflet/dist/leaflet.css'

const MapPanel = ({ 
  fullScreen = true, 
  initialZoom = 3, 
  initialCenter = [-55.94, 111.88],
  minZoom = 3,
  maxZoom = 6,
  scrollWheelZoom = true,
  debug = false,
  showFullScreenLink = false
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
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);

  const toggleMeasureMode = () =>
  {
    if (isMeasureMode)
    {
      setIsMeasureMode(false);
      return;
    }

    setIsMeasureMode(true);
  };

  const clearMeasurements = () =>
  {
    setMeasurePoints([]);
  };

  const handleMapClick = (point) =>
  {
    if (!isMeasureMode)
    {
      return;
    }

    setMeasurePoints((prevPoints) => [...prevPoints, point]);
  };

  const getClampedRatio = (value) =>
  {
    if (value < 0)
    {
      return 0;
    }

    if (value > 1)
    {
      return 1;
    }

    return value;
  };

  const convertMapPointToLatLon = (point) =>
  {
    const southBound = maxBounds[0][0];
    const westBound = maxBounds[0][1];
    const northBound = maxBounds[1][0];
    const eastBound = maxBounds[1][1];

    const latRatio = getClampedRatio((point[0] - southBound) / (northBound - southBound));
    const lonRatio = getClampedRatio((point[1] - westBound) / (eastBound - westBound));

    const latitude = (latRatio * 180) - 90;
    const longitude = (lonRatio * 360) - 180;

    return [latitude, longitude];
  };

  const toRadians = (degrees) =>
  {
    return degrees * (Math.PI / 180);
  };

  const calculateGreatCircleSegmentKm = (startPoint, endPoint) =>
  {
    const earthLikeRadiusKm = 6371;
    const startLatLon = convertMapPointToLatLon(startPoint);
    const endLatLon = convertMapPointToLatLon(endPoint);

    const latitudeOne = toRadians(startLatLon[0]);
    const latitudeTwo = toRadians(endLatLon[0]);
    const deltaLatitude = toRadians(endLatLon[0] - startLatLon[0]);
    const deltaLongitude = toRadians(endLatLon[1] - startLatLon[1]);

    const haversineA = (Math.sin(deltaLatitude / 2) ** 2)
      + (Math.cos(latitudeOne) * Math.cos(latitudeTwo) * (Math.sin(deltaLongitude / 2) ** 2));
    const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));

    return earthLikeRadiusKm * haversineC;
  };

  const getTotalMeasuredDistanceKm = () =>
  {
    if (measurePoints.length < 2)
    {
      return 0;
    }

    let totalDistance = 0;
    for (let index = 1; index < measurePoints.length; index++)
    {
      const previousPoint = measurePoints[index - 1];
      const currentPoint = measurePoints[index];
      totalDistance += calculateGreatCircleSegmentKm(previousPoint, currentPoint);
    }

    return totalDistance;
  };

  const renderMeasurements = () =>
  {
    if (measurePoints.length === 0)
    {
      return null;
    }

    return (
      <>
        <Polyline positions={measurePoints} pathOptions={{ color: "#0C66E4", weight: 3 }} />
        {measurePoints.map((point, index) => (
          <CircleMarker key={`measure-point-${index}`} center={point} radius={4} pathOptions={{ color: "#0C66E4", fillColor: "#0C66E4", fillOpacity: 1 }} />
        ))}
      </>
    );
  };

  const renderMeasureIndicator = () =>
  {
    if (!isMeasureMode)
    {
      return null;
    }

    return (
      <div className="measure-indicator">
        Measure: {getTotalMeasuredDistanceKm().toFixed(2)} km ({measurePoints.length} pts)
      </div>
    );
  };

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
          {renderMeasurements()}
          <EventComponent updateZoom={updateZoom} updateCoords={updateCoords} onMapClick={handleMapClick} />
          <ResetViewControl initialCenter={initialCenter} initialZoom={initialZoom} />
          <MeasureDistanceControl isMeasureMode={isMeasureMode} onToggleMeasureMode={toggleMeasureMode} onClearMeasurements={clearMeasurements} />
          <FullScreenLinkControl showFullScreenLink={showFullScreenLink} />
          {/* <AttributionControl
            position={"bottomright"}
            prefix={"Icons from Game-icons.net"}
          /> */}
        </MapContainer>
        {renderMeasureIndicator()}
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
          {renderMeasurements()}
          <EventComponent updateZoom={updateZoom} updateCoords={updateCoords} onMapClick={handleMapClick} />
          <ResetViewControl initialCenter={initialCenter} initialZoom={initialZoom} />
          <MeasureDistanceControl isMeasureMode={isMeasureMode} onToggleMeasureMode={toggleMeasureMode} onClearMeasurements={clearMeasurements} />
          <FullScreenLinkControl showFullScreenLink={showFullScreenLink} />
          {/* <AttributionControl
            position={"bottomright"}
            prefix={"Icons from Game-icons.net"}
          /> */}
        </MapContainer>
        {renderMeasureIndicator()}
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
