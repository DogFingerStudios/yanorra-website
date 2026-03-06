import { useEffect, useState } from 'react'
import { marked } from 'marked'

const AboutPage = () =>
{
  const [html, setHtml] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() =>
  {
    const loadAboutMarkdown = async () =>
    {
      try
      {
        setLoading(true)
        setError(null)

        const response = await fetch('/ABOUT.md')
        if (!response.ok)
        {
          throw new Error(`Failed to load ABOUT.md: ${response.statusText}`)
        }

        const markdown = await response.text()
        const parsedHtml = marked.parse(markdown, { async: false }) as string
        setHtml(parsedHtml)
      }
      catch (err)
      {
        if (err instanceof Error)
        {
          setError(err.message)
        }
        else
        {
          setError('Unknown error')
        }
      }
      finally
      {
        setLoading(false)
      }
    }

    loadAboutMarkdown()
  }, [])

  if (loading)
  {
    return (
      <div style={{ padding: '0.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>About</h1>
        <div>Loading...</div>
      </div>
    )
  }

  if (error)
  {
    return (
      <div style={{ padding: '0.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>About</h1>
        <div style={{ color: 'red' }}>Error: {error}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div 
        style={{ padding: '12px 14px', borderRadius: '6px', background: '#E9F2FF', border: '1px solid #B3D4FF', margin: '12px 0', color: '#213547' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export default AboutPage
