import React from "react";
import MapPanel from "./MapPanel";
import "../styles/ContainerizedPage.css";

const ContainerizedPage = ({ onBack }) => {
  return (
    <div className="containerized-page">
      <div className="content-side-panel">
        <button className="back-button" onClick={onBack}>
          ← Back to Map
        </button>
        <div className="page-content">


<h1>Saint Aveline</h1>
<p><img src="../Maps/SaintAveline-GlobeView.jpeg" alt="Saint Aveline - Globe View"/>
<img src="../Maps/SaintAveline-LocalizedView.png" alt="Saint Aveline - Localized View"/></p>
<p><strong>Saint Aveline</strong> is a remote island settlement located in <a href="./The_Farlands.md">The Farlands</a>, far north of the primary trade routes between Duvessa and Velu. It is widely regarded as one of the most isolated inhabited places in the known world.</p>
<p>Despite its small population and remote location, Saint Aveline holds strategic, historical, and symbolic importance disproportionate to its size.</p>
<hr/>
<h2>Geography</h2>
<p><strong>Location</strong>: Saint Aveline lies north of <a href="./Sabletown_Isle.md">Sabletown Isle</a> beyond the regular stops of maritime supply routes. It is surrounded by smaller satellite islets and exposed shoals, many of which are uncharted or only partially mapped due to shifting tides and hazardous waters.</p>
<p>The island sits beneath volatile atmospheric convergence zones influenced by Yanorraâ€™s unstable orbit and the competing gravitational effects of <a href="./The_Drift.md">The Drift</a>. As a result, sudden storms, unpredictable winds, and extreme seasonal swings are common.</p>
<p><strong>Terrain</strong>: Saint Aveline is a volcanic island dominated by the dormant caldera of an ancient volcano. The landscape is rugged and windswept, with rocky cliffs, narrow coves, and limited arable land. The coastline is marked by jagged basalt formations and treacherous reefs.</p>
<p>The interior rises toward the volcanic peaks, with low ridgelines and sparse vegetation adapted to harsh conditions. Most significantly, the caldera contains a substantial freshwater lakeâ€”a critical resource for the settlement&#39;s survival. Within this crater lake lies <strong>Lognom&#39;s Island</strong>, a small landmass of volcanic origin. The island hosts <strong>Lognom&#39;s Pond</strong>, a shallow freshwater basin whose origins and properties remain poorly understood by local scholars.</p>
<p>Access to both Lognom&#39;s Island and the crater lake is limited by steep caldera walls and unpredictable water conditions. The site holds both practical and speculative significance; some residents regard it as sacred ground, while others view it as a potential secondary water source should coastal supplies fail.</p>
<hr/>
<h2>Climate and Environment</h2>
<p>Saint Aveline experiences long, dark winters and brief, intense summers. Snowfall can occur during anytime of year, and thawâ€“freeze cycles are irregular. Coastal winds are particularly severe, often carrying low-frequency atmospheric noise that interferes with radio communication and navigation instruments.</p>
<p>Vegetation is limited to hardy grasses, lichen, and wind-resistant shrubs. Animal life is sparse but well-adapted, consisting primarily of seabirds, cold-water fish, and small terrestrial mammals introduced during pre-Drift settlement efforts.</p>
<hr/>
<h2>Political Status</h2>
<p>Saint Aveline is <strong>technically</strong> claimed by <a href="./Duvessa.md">Duvessa</a> as part of its holdings in <a href="./The_Farlands.md">The Farlands</a>. In practice, governance is minimal. The island receives infrequent oversight, and most administrative authority is exercised locally.</p>
<p>The ruling power within Duvessa, the <a href="./The_Dornish_Order.md">The Dornish Order</a>, maintains nominal jurisdiction over the island but does not station permanent forces there. Enforcement is largely symbolic, relying on supply control rather than direct rule.</p>
<hr/>
<h2>Settlement and Population</h2>
<p>The primary settlement, commonly referred to simply as <em>Saint Aveline</em>, is located along a sheltered inlet on the islandâ€™s southern coast. Buildings are constructed from stone, salvaged timber, and imported materials reused across generations.</p>
<p>Population estimates vary, typically ranging between several hundred and just over a thousand residents depending on seasonal conditions, departures, and unrecorded losses at sea. Census accuracy is poor, and migration is largely one-directional; few who leave ever return.</p>
<hr/>
<h2>Economy and Supply</h2>
<p>Saint Aveline has no true export economy. Local subsistence relies on fishing, limited agriculture, scavenging, and repair work. Imported goods arrive via irregular supply ships routed through <a href="./Sabletown_Isle.md">Sabletown Isle</a>, when conditions allow.</p>
<p>Fuel, medicine, replacement machine parts, and preserved food are considered critical supplies. Electrical power is intermittent and locally generated, often failing during prolonged storms or winter darkness.</p>
<hr/>
<h2>Cultural Significance</h2>
<p>Among Yanorran scholars and storytellers, Saint Aveline occupies a liminal place in cultural memory. It is often described as <em>â€œthe last light northwardâ€</em>, symbol of endurance at the edge of the known world.</p>
<p>The island is also associated with unexplained phenomena: atmospheric anomalies, electromagnetic interference, and sightings attributed to environmental stress or sensory distortion. While none are officially classified as supernatural, Saint Aveline is frequently cited as an example of the limitations of scientific understanding in the face of extreme environments.</p>
<hr/>
<h2>Historical Context</h2>
<p>Pre-Drift records indicate Saint Aveline was once a minor but functional waypoint during northern exploratory efforts. After The Drift, worsening sea conditions severed regular travel, and the islandâ€™s role shifted from transit hub to long-term outpost.</p>
<p>Despite multiple proposals to abandon the settlement entirely, Saint Aveline has remained continuously inhabitedâ€”largely due to tradition of a native population with deep ties to the land and a reluctance to leave, even in the face of hardship.</p>
<hr/>
<p><em>See also:</em> <a href="./The_Farlands.md">The Farlands</a>, <a href="./The_Riftlands.md">The Riftlands</a>, <a href="./Duvessa.md">Duvessa</a>, <a href="./The_Drift.md">The Drift</a></p>

    </div>
      </div>
      <div className="right-side-panels">
        <div className="info-panel">
          {/* Add image and text content here */}
          <img 
            className="small-image"
            src="https://raw.githubusercontent.com/DogFingerStudios/Yanorra/refs/heads/master/Maps/SaintAveline-GlobeView.jpeg" alt="Saint Aveline Globe View"
          />
        </div>
        <div className="map-side-panel">
          <MapPanel fullScreen={false} />
        </div>
      </div>
    </div>
  );
};

export default ContainerizedPage;
