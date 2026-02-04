import type { Plugin } from 'vite'
import * as fs from 'fs'
import * as path from 'path'
import Asciidoctor from '@asciidoctor/core'

interface AsciidocFile
{
  source_file: string
  destination_file: string
}

const filesToConvert: AsciidocFile[] = 
[
  {
    source_file: 'data/README.adoc',
    destination_file: 'dist/data/README.html'
  }
]

export function asciidocPlugin(): Plugin 
{
  const asciidoctor = Asciidoctor()

  return {
    name: 'vite-plugin-asciidoc',
    
    closeBundle() 
    {
      // Convert each ADOC file to HTML
      for (const file of filesToConvert)
      {
        const sourceFile = path.resolve(__dirname, file.source_file)
        const outputFile = path.resolve(__dirname, file.destination_file)
        const outputDir = path.dirname(outputFile)

        // Read the ADOC file
        const adocContent = fs.readFileSync(sourceFile, 'utf-8')

        // Convert to HTML
        const html = asciidoctor.convert(adocContent, 
          {
              safe: 'safe',
              attributes: { showtitle: true }
          })

          // Create output directory if it doesn't exist
          if (!fs.existsSync(outputDir)) 
          {
              fs.mkdirSync(outputDir, { recursive: true })
          }

        // Write the HTML file
        fs.writeFileSync(outputFile, html as string)

        console.log(`✓ Converted ${sourceFile} → ${outputFile}`)
      }
    }
  }
}
