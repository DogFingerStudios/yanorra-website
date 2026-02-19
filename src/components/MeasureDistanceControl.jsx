const MeasureDistanceControl = ({ isMeasureMode, onToggleMeasureMode, onClearMeasurements }) =>
{
  const getMeasureButtonTitle = () =>
  {
    if (isMeasureMode)
    {
      return "Turn off measure mode";
    }

    return "Turn on measure mode";
  };

  const getMeasureButtonStyle = () =>
  {
    if (isMeasureMode)
    {
      return {
        width: "30px",
        height: "30px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        borderRadius: 0,
        padding: 0,
        backgroundColor: "#e7f0ff"
      };
    }

    return {
      width: "30px",
      height: "30px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      borderRadius: 0,
      padding: 0
    };
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: "108px" }}>
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={onToggleMeasureMode}
          onMouseDown={(event) => event.stopPropagation()}
          title={getMeasureButtonTitle()}
          aria-label="Toggle measure mode"
          style={getMeasureButtonStyle()}
        >
          📏
        </button>
        <button
          type="button"
          onClick={onClearMeasurements}
          onMouseDown={(event) => event.stopPropagation()}
          title="Clear measured points"
          aria-label="Clear measured points"
          style={{
            width: "30px",
            height: "30px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            borderRadius: 0,
            padding: 0,
            borderTop: "1px solid #ccc"
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default MeasureDistanceControl;
