import { useState } from 'react'
import './SideColumn.css'
import { docLinks } from './docsConfig'
import { Link } from 'react-router-dom'

const encodeDocPath = (docPath: string): string =>
{
  return docPath
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function SideColumn() 
{
  const [isOpen, setIsOpen] = useState(true)

  function togglePanel()
  {
    setIsOpen(!isOpen)
  }

  return (
    <aside className={`side-column-shell${isOpen ? ' side-column-shell--open' : ''}`}>
      <div className="side-column">
        {isOpen ? (
          <button
            type="button"
            className="side-column-collapse-button"
            onClick={togglePanel}
            aria-label="Collapse wiki sidebar"
            title="Collapse wiki sidebar"
          >
            ◀
          </button>
        ) : null}
        <ul className="side-column-list">
          {docLinks.map((doc) => (
            <li key={doc.path} className="side-column-list-item">
              <Link className="side-column-link" to={`/${encodeDocPath(doc.path)}`}>
                {doc.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {!isOpen ? (
        <div className="side-column-mini-panel" aria-label="Sidebar controls">
          <button
            type="button"
            className="side-column-mini-button"
            onClick={togglePanel}
            aria-label="Expand wiki sidebar"
            title="Expand wiki sidebar"
          >
            ▶
          </button>
          <a
            className="side-column-mini-button side-column-mini-link"
            href="/"
            aria-label="Go to yanorra.world"
            title="Go to yanorra.world"
          >
            ⌂
          </a>
        </div>
      ) : null}
    </aside>
  )
}

export default SideColumn
