const AboutPage = () =>
{
  return (
    <div style={{ padding: '0.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>About</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '6px', background: '#E9F2FF', border: '1px solid #B3D4FF', margin: '12px 0' }}>
            <div>
                <p>Yanorra is a fictional Earth-like planet and the primary setting of the game <a href="https://dogfinger.com/saintaveline/" target="_blank"><strong>Saint Aveline</strong></a>.</p>
                <p>Similar in size, gravity, and atmosphere to Earth, Yanorra supports complex ecosystems and human civilizations. <strong>Time on Yanorra is measured in cycles</strong> with each cycle representing one complete rotation of the planet, equivalent to approximately one Earth day.</p>
                <p>Roughly 146,100 cycles ago (about 400 Earth years), a massive object referred to as <strong>Lo-Disporum</strong> disrupted its orbit in an event called <strong>The Drift</strong>. This forced the planet into an unstable elliptical path around its red-hued star, the <strong>Ember Mother</strong>.</p>
                <p>Technology on Yanorra resembles a restrained late-20th-century world: electricity is unreliable, aircraft do not exist, and computing is largely text-based through a terminal network known as the <em>Intalink</em>.</p>
                <p>The result is a world both familiar and fractured, shaped by environmental instability and existential uncertainty.</p>
                <p><strong>This wiki documents Yanorra’s geography, history, culture, and technology from an in-world perspective, evolving alongside the game and its community.</strong></p>
            </div>
        </div>
    </div>
  )
}

export default AboutPage
