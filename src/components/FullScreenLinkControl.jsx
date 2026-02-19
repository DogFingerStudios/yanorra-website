const FullScreenLinkControl = ({ showFullScreenLink }) =>
{
  if (!showFullScreenLink)
  {
    return null;
  }

  const handleClick = (event) =>
  {
    event.preventDefault();
    event.stopPropagation();
    window.location.assign("/map");
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: "184px" }}>
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={handleClick}
          onMouseDown={(event) => event.stopPropagation()}
          title="Open full screen map"
          aria-label="Open full screen map"
          style={{
            width: "30px",
            height: "30px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            borderRadius: 0,
            padding: 0
          }}
        >
          🌐
        </button>
      </div>
    </div>
  );
};

export default FullScreenLinkControl;
