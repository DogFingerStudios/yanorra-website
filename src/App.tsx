import { useState } from 'react'
import { Routes, Route, Navigate, useParams, useNavigate, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import SideColumn from './SideColumn'

const normalizeDocPath = (docPath: string): string =>
{
  return docPath.replace(/^\/+/, '')
}

const encodeDocPath = (docPath: string): string =>
{
  return normalizeDocPath(docPath)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

const HomeContent = () =>
{
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          {/* <img src={viteLogo} className="logo" alt="Vite logo" /> */}
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <div style={{ padding: 24 }}>
        <h1>Yanorra</h1>
        <p>Intalink-ready. Static deploy. Auto Uploaded. Wow!!!</p>
      </div>

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
              <Link to={`/${encodeDocPath('/Yanorra.html')}`}>
                README
              </Link>
            </li>
            <li>
              <Link to={`/${encodeDocPath('/wiki/Lo-Disporum.html')}`}>
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
  return (
    <div className="app-container">
      <SideColumn />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeContent />} />
          <Route path="/*" element={<DocContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
