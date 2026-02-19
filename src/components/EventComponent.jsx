import { useMapEvents } from "react-leaflet";

const EventComponent = ({ updateZoom, updateCoords, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      updateCoords([e.latlng.lat, e.latlng.lng]);
      if (onMapClick)
      {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
    zoomend: (e) => {
      updateZoom(e.target._zoom);
    },
    move: (e) => {
      const center = e.target.getCenter();
      updateCoords([center.lat, center.lng]);
    },
  });
  return null;
};
export default EventComponent;
