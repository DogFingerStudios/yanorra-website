import { useMap } from "react-leaflet";

const ResetViewControl = ({ initialCenter, initialZoom }) =>
{
  const map = useMap();

  const resetView = (event) =>
  {
    event.preventDefault();
    event.stopPropagation();
    map.setView(initialCenter, initialZoom);
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: "72px" }}>
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={resetView}
          onMouseDown={(event) => event.stopPropagation()}
          className="leaflet-control-reset"
          title="Return to center"
          aria-label="Return to center"
          style={{
            width: "30px",
            height: "30px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            borderRadius: 0,
            padding: 0
          }}
        >
          ⊕
        </button>
      </div>
    </div>
  );
};

export default ResetViewControl;
