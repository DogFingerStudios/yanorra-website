import { useState } from 'react'
import { Routes, Route, Navigate, useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import SideColumn from './SideColumn'
import MapPanel from "./components/MapPanel.jsx";

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

// const HomeContent = () =>
// {
//   const [count, setCount] = useState(0)
//   return (
//     <>
//       <MapPanel fullScreen={true} />
//       <MapPanel fullScreen={false} />
//     </>
//   )
// }

const HomeContent = () =>
{
  const [count, setCount] = useState(0)

  return (
    <>
      <div style={{ padding: 5 }}>
        <h1>Yanorra</h1>
        <Link to="/fullscreen">
          <button type="button">
            Full Screen
          </button>
        </Link>
      </div>

      <MapPanel fullScreen={false} />

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <div style={{ marginTop: '2rem' }}>
          <h3>Generated Docs</h3>
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
          </ul>
        </div>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
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
  const isFullscreenRoute = location.pathname === '/fullscreen'
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
          <Route path="/fullscreen" element={<App2 />} />
          <Route path="/doc/*" element={<DocContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App2()
{
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', zIndex: 1000, top: '0.5rem', left: '50%', transform: 'translateX(-50%)' }}>
        <Link to="/">
          <button type="button">
            Exit Full Screen
          </button>
        </Link>
      </div>
      <MapPanel fullScreen={true} />
    </div>
  )
}

export default App
