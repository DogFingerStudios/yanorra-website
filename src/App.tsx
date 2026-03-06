import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import './App.css'
import SideColumn from './SideColumn'
import MarkdownPage from "./components/MarkdownPage"
import MapFullScreen from "./components/MapFullScreen";
import AboutPage from './components/AboutPage'
import ReplPage from './components/ReplPage'
import { Link } from 'react-router-dom'

const normalizeDocPath = (docPath: string): string =>
{
  return docPath.replace(/^\//, '')
}

const WikiPage = () =>
{
  const { filename } = useParams<{ filename: string }>()
  const markdownPath = `/Yanorra/Wiki/${filename}.md`
  return <MarkdownPage markdownPath={markdownPath} />
}

const DocContent = () =>
{
  console.log("Rendering DocContent")
  const { '*': docPath } = useParams()

  if (!docPath)
  {
    return <MarkdownPage markdownPath="/Yanorra/README.md" />
  }

  const decodedDocPath = decodeURIComponent(docPath)
  const resolvedDocPath = normalizeDocPath(decodedDocPath)

  if (!resolvedDocPath)
  {
    console.warn("No document path provided, defaulting to README.md")
    return <MarkdownPage markdownPath="/Yanorra/README.md" />
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe 
        src={`/${resolvedDocPath}`} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Document viewer"
      />
    </div>
  )
}

const TopHeader = () =>
{
  return (
    <header className="top-header">
      <div className="top-header-left">
        <Link className="top-header-brand" to="/">
          Yanorra
        </Link>
        <span className="top-header-spacer" aria-hidden="true" />
        <Link className="top-header-link" to="/">
          Wiki
        </Link>
        <span className="top-header-separator" aria-hidden="true">|</span>
        <Link className="top-header-link" to="/map">
          Map
        </Link>
                <span className="top-header-separator" aria-hidden="true">|</span>
        <Link className="top-header-link" to="/terminal">
          Terminal
        </Link>
        <span className="top-header-separator" aria-hidden="true">|</span>
        <Link className="top-header-link" to="/about">
          About
        </Link>
      </div>
      <div className="top-header-right">
        <a
          className="top-header-link"
          href="https://github.com/DogFingerStudios/Yanorra-website"
          target="_blank"
          rel="noreferrer"
        >
          Github
        </a>
        <span className="top-header-separator" aria-hidden="true">|</span>
        <a
          className="top-header-link"
          href="https://discord.gg/52pdVzds"
          target="_blank"
          rel="noreferrer"
        >
          Discord
        </a>
      </div>
    </header>
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
    <div className="app-shell">
      <TopHeader />
      <div className={appContainerClassName}>
        {!isFullscreenRoute && <SideColumn />}
        <main className={mainContentClassName}>
          <Routes>
            <Route 
              path="/" 
              element={<MarkdownPage markdownPath="/Yanorra/README.md" />} 
            />
            <Route 
              path="/about" 
              element={<AboutPage />} 
            />
            <Route path="/terminal" element={<ReplPage />} />
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
    </div>
  )
}

export default App
