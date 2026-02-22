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
  return (
    <aside className="side-column">
      {/* <Link to="/">
        <h3>Yanorra</h3>
      </Link> */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {docLinks.map((doc) => (
          <li key={doc.path} style={{ marginBottom: '0.5rem' }}>
            <Link className="side-column-link" to={`/${encodeDocPath(doc.path)}`}>
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default SideColumn
