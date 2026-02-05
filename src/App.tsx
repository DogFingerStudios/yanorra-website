import { useState } from 'react'
import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import SideColumn from './SideColumn'

function App()
{
  const [count, setCount] = useState(0)
  const [currentDoc, setCurrentDoc] = useState<string | null>(null)

  return (
    <div className="app-container">
      <SideColumn />
      <main className="main-content">
      {
        currentDoc ? 
        (
          <div style={{ width: '100%', height: '100%' }}>
            <button 
              onClick={() => setCurrentDoc(null)} 
              style={{ marginBottom: '1rem' }}
            >
              ← Back
            </button>
            <iframe 
              src={currentDoc} 
              style={{ width: '100%', height: 'calc(100% - 50px)', border: 'none' }}
              title="Document viewer"
            />
          </div>
        ) 
        : 
        (
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
                    <a 
                      href="#" 
                      onClick={(e) => 
                      {
                        e.preventDefault()
                        setCurrentDoc('/data/README.html')
                      }}
                    >
                      README
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      onClick={(e) => 
                      {
                        e.preventDefault()
                        setCurrentDoc('/data/Lo-Disporum.html')
                      }}
                    >
                      Lo-Disporum
                    </a>
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
      </main>
    </div>
  )
}

export default App
