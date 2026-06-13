import { useState } from 'react'
import './SideColumn.css'
import { docLinks, nationLinks } from './docsConfig'
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
    const [isPagesOpen, setIsPagesOpen] = useState(true)

    function togglePanel()
    {
        setIsOpen(!isOpen)
    }

    function toggleNations()
    {
        setIsNationsOpen(!isNationsOpen)
    }

    function togglePages()
    {
        setIsPagesOpen(!isPagesOpen)
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
        
                {isOpen && nationLinks.length > 0 ? (
                <>
                    <h3 className="side-column-title">
                        <button
                            type="button"
                            className="side-column-title-button"
                            onClick={toggleNations}
                            aria-expanded={isNationsOpen}
                            aria-controls="side-column-nations-list"
                        >
                            <span>🌍 Nations</span>
                            <span className="side-column-title-caret" aria-hidden="true">{isNationsOpen ? '▾' : '▸'}</span>
                        </button>
                    </h3>
                    {isNationsOpen ? (
                    <ul id="side-column-nations-list" className="side-column-list">
                    {nationLinks.map((doc) => (
                        <li key={doc.path} className="side-column-list-item">
                        <Link className="side-column-link" to={`/${encodeDocPath(doc.path)}`}>
                            {doc.title}
                        </Link>
                        </li>
                    ))}
                    </ul>
                    ) : null}
                </>
                ) : null}

                {isOpen ? (
                <>
                    <h3 className="side-column-title">
                        <button
                            type="button"
                            className="side-column-title-button"
                            onClick={togglePages}
                            aria-expanded={isPagesOpen}
                            aria-controls="side-column-pages-list"
                        >
                            <span>📚 Pages</span>
                            <span className="side-column-title-caret" aria-hidden="true">{isPagesOpen ? '▾' : '▸'}</span>
                        </button>
                    </h3>
                    {isPagesOpen ? (
                    <ul id="side-column-pages-list" className="side-column-list">
                    {docLinks.map((doc) => (
                        <li key={doc.path} className="side-column-list-item">
                        <Link className="side-column-link" to={`/${encodeDocPath(doc.path)}`}>
                            {doc.title}
                        </Link>
                        </li>
                    ))}
                    </ul>
                    ) : null}
                </>
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
