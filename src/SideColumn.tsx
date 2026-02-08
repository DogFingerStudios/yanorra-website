import './SideColumn.css'
import { docLinks } from './docsConfig'

interface SideColumnProps
{
  onDocClick: (path: string) => void
}

function SideColumn({ onDocClick }: SideColumnProps) 
{
  return (
    <aside className="side-column">
      <h3>Yanorra</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {docLinks.map((doc) => (
          <li key={doc.path} style={{ marginBottom: '0.5rem' }}>
            <a
              href="#"
              onClick={(e) =>
              {
                e.preventDefault()
                onDocClick(doc.path)
              }}
              className="side-column-link"
            >
              {doc.title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default SideColumn
