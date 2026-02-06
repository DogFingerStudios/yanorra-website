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
      <h3>Documents</h3>
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
              style={{ color: '#000', textDecoration: 'none' }}
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
