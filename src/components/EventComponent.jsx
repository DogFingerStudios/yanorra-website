import { useMapEvents } from "react-leaflet";

const EventComponent = ({ updateZoom, updateCoords }) => {
  useMapEvents({
    click: (e) => {
      console.log(e.latlng);
      updateCoords([e.latlng.lat, e.latlng.lng]);
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
