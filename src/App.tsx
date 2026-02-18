import { useState } from 'react'
import { Routes, Route, Navigate, useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import './App.css'
import SideColumn from './SideColumn'
import MapPanel from "./components/MapPanel.jsx"
import MarkdownPage from "./components/MarkdownPage"
import AsciiDocPage from "./components/AsciiDocPage"
import MapFullScreen from "./components/MapFullScreen";

const normalizeDocPath = (docPath: string): string =>
{
  return docPath.replace(/^\//, '')
}

const encodeDocPath = (docPath: string): string =>
{
  return normalizeDocPath(docPath)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

const WikiPage = () =>
{
  const { filename } = useParams<{ filename: string }>()
  const markdownPath = `/Yanorra/Wiki/${filename}.md`
  return <MarkdownPage markdownPath={markdownPath} />
}

const HomeContent = () =>
{
  const [mapVisible, setMapVisible] = useState(true)

  const getMapButtonText = () => 
  {
    if (mapVisible)
    {
      return "Hide Map";
    }

    return "Show Map";
  };

  const renderMapPanel = () => 
  {
    if (mapVisible)
    {
      return <MapPanel fullScreen={false} />;
    }

    return null;
  };

  return (
    <>
      <div style={{ padding: 5 }}>
        <h1>Yanorra</h1>
        <Link to="/map" style={{ marginRight: '0.5rem' }}>
          <button
            type="button"
            aria-label="View map in full screen"
          >
            Full Screen
          </button>
        </Link>
        <button type="button" onClick={() => setMapVisible(!mapVisible)}>
          {getMapButtonText()}
        </button>
      </div>

      <div className="card">
        <div style={{ marginTop: '2rem' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <Link to={`/doc/${encodeDocPath('/Yanorra.html')}`}>
                README
              </Link>
            </li>
            <li>
              <Link to={`/doc/${encodeDocPath('/wiki/Lo-Disporum.html')}`}>
                Lo-Disporum
              </Link>
            </li>
            <li>
              <Link to="/wiki/saint-aveline">
                Saint Aveline (Markdown Test)
              </Link>
            </li>
            <li>
              <Link to="/wiki/bibi-shirif">
                Bibi Shirif (AsciiDoc Test)
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {renderMapPanel()}
      
    </>
  )
}

const DocContent = () =>
{
  const { '*': docPath } = useParams()
  const navigate = useNavigate()

  if (!docPath)
  {
    return <Navigate to="/" replace />
  }

  const decodedDocPath = decodeURIComponent(docPath)
  const resolvedDocPath = normalizeDocPath(decodedDocPath)

  if (!resolvedDocPath)
  {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <button 
        onClick={() => 
        {
          navigate('/')
        }} 
        style={{ marginBottom: '1rem' }}
      >
        ← Back
      </button>
      <iframe 
        src={`/${resolvedDocPath}`} 
        style={{ width: '100%', height: 'calc(100% - 50px)', border: 'none' }}
        title="Document viewer"
      />
    </div>
  )
}

function App()
{
  const location = useLocation()
  const isFullscreenRoute = location.pathname === '/fullscreen' || location.pathname === '/map'
  let appContainerClassName = 'app-container'
  let mainContentClassName = 'main-content'

  if (isFullscreenRoute)
  {
    appContainerClassName = 'app-container fullscreen'
    mainContentClassName = 'main-content fullscreen'
  }

  return (
    <div className={appContainerClassName}>
      {!isFullscreenRoute && <SideColumn />}
      <main className={mainContentClassName}>
        <Routes>
          <Route path="/" element={<HomeContent />} />
          <Route path="/map" element={<MapFullScreen />} />
          <Route path="/doc/*" element={<DocContent />} />
          <Route 
            path="/wiki/:filename" 
            element={<WikiPage />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
