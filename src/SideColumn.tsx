import { useState } from 'react'
import './SideColumn.css'
import { docLinks, nationLinks, settlementLinks } from './docsConfig'
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
  const [isNationsOpen, setIsNationsOpen] = useState(true)
  const [isSettlementsOpen, setIsSettlementsOpen] = useState(true)
  const [isPagesOpen, setIsPagesOpen] = useState(true)

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
        
        <h1 className="side-column-heading">Yanorra</h1>

        {isOpen && nationLinks.length > 0 ? (
          <>
            <button
              type="button"
              className={`side-column-section-toggle${isNationsOpen ? '' : ' side-column-section-toggle--collapsed'}`}
              onClick={() => setIsNationsOpen(!isNationsOpen)}
              aria-expanded={isNationsOpen}
              aria-controls="side-column-section-nations"
            >
              <span className="side-column-title-text">Nations</span>
              <span className="side-column-section-indicator" aria-hidden="true">
                {isNationsOpen ? '−' : '+'}
              </span>
            </button>
          </>
        ) : null}
        {isOpen && isNationsOpen ? (
          <ul id="side-column-section-nations" className="side-column-list">
            {nationLinks.map((doc) => (
              <li key={doc.path} className="side-column-list-item">
                <Link className="side-column-link" to={`/${encodeDocPath(doc.path)}`}>
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {isOpen && settlementLinks.length > 0 ? (
          <button
            type="button"
            className={`side-column-section-toggle${isSettlementsOpen ? '' : ' side-column-section-toggle--collapsed'}`}
            onClick={() => setIsSettlementsOpen(!isSettlementsOpen)}
            aria-expanded={isSettlementsOpen}
            aria-controls="side-column-section-settlements"
          >
            <span className="side-column-title-text">Settlements</span>
            <span className="side-column-section-indicator" aria-hidden="true">
              {isSettlementsOpen ? '−' : '+'}
            </span>
          </button>
        ) : null}
        {isOpen && isSettlementsOpen ? (
          <ul id="side-column-section-settlements" className="side-column-list">
            {settlementLinks.map((doc) => (
              <li key={doc.path} className="side-column-list-item">
                <Link className="side-column-link" to={`/${encodeDocPath(doc.path)}`}>
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {isOpen ? (
          <button
            type="button"
            className={`side-column-section-toggle${isPagesOpen ? '' : ' side-column-section-toggle--collapsed'}`}
            onClick={() => setIsPagesOpen(!isPagesOpen)}
            aria-expanded={isPagesOpen}
            aria-controls="side-column-section-pages"
          >
            <span className="side-column-title-text">Pages</span>
            <span className="side-column-section-indicator" aria-hidden="true">
              {isPagesOpen ? '−' : '+'}
            </span>
          </button>
        ) : null}
        {isOpen && isPagesOpen ? (
          <ul id="side-column-section-pages" className="side-column-list">
            {docLinks.map((doc) => (
              <li key={doc.path} className="side-column-list-item">
                <Link className="side-column-link" to={`/${encodeDocPath(doc.path)}`}>
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
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
