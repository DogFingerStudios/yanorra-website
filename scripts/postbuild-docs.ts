import * as fs from 'fs'
import * as path from 'path'

const projectRoot = process.cwd()
const publicDir = path.join(projectRoot, 'public')
const distDir = path.join(projectRoot, 'dist')

const copyRecursive = (src: string, dest: string): void =>
{
  if (!fs.existsSync(src))
  {
    return
  }

  const stat = fs.statSync(src)
  if (stat.isDirectory())
  {
    if (!fs.existsSync(dest))
    {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src)
    for (const entry of entries)
    {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }

    return
  }

  fs.copyFileSync(src, dest)
}

const run = (): void =>
{
  if (!fs.existsSync(distDir))
  {
    console.warn('dist not found, skipping postbuild docs move')
    return
  }

  if (!fs.existsSync(publicDir))
  {
    console.warn('public not found, skipping postbuild docs move')
    return
  }

  copyRecursive(publicDir, distDir)
  fs.rmSync(publicDir, { recursive: true, force: true })
  console.log('✓ Moved public docs into dist and cleaned up public')
}

run()
