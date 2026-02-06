import type { Plugin } from 'vite'
import * as fs from 'fs'
import * as path from 'path'
import { marked } from 'marked'

interface MarkdownFile
{
  source_file: string
  destination_file: string
}

const wikiDir = path.resolve(__dirname, 'Yanorra/Wiki')
const filesToConvert: MarkdownFile[] = fs.readdirSync(wikiDir)
  .filter((file) =>
  {
    return file.toLowerCase().endsWith('.md')
  })
  .map((file) =>
  {
    return {
      source_file: path.join('Yanorra/Wiki', file),
      destination_file: path.join('dist/wiki', file.replace(/\.md$/i, '.html'))
    }
  })

export function markdownPlugin(): Plugin 
{
  return {
    name: 'vite-plugin-markdown',
    
    async closeBundle() 
    {
      // Convert each Markdown file to HTML
      for (const file of filesToConvert)
      {
        const sourceFile = path.resolve(__dirname, file.source_file)
        const outputFile = path.resolve(__dirname, file.destination_file)
        const outputDir = path.dirname(outputFile)

        // Read the Markdown file
        const markdownContent = fs.readFileSync(sourceFile, 'utf-8')

        // Convert to HTML
        const html = await marked(markdownContent)

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) 
        {
          fs.mkdirSync(outputDir, { recursive: true })
        }

        // Write the HTML file
        fs.writeFileSync(outputFile, html)

        console.log(`✓ Converted ${sourceFile} → ${outputFile}`)
      }
    }
  }
}
