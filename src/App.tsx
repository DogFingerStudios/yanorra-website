import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import './App.css'
import SideColumn from './SideColumn'
import MarkdownPage from "./components/MarkdownPage"
import MapFullScreen from "./components/MapFullScreen";

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
          <Route 
            path="/" 
            element={<MarkdownPage markdownPath="/Yanorra/README.md" />} 
          />
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
