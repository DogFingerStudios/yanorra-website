import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const getRepoDir = (repoName: string): string | null =>
{
  const currentDir = process.cwd()
  const currentGitDir = path.join(currentDir, '.git')
  if (path.basename(currentDir).toLowerCase() === repoName.toLowerCase() && fs.existsSync(currentGitDir))
  {
    return currentDir
  }

  const repoDir = path.join(currentDir, repoName)
  const repoGitDir = path.join(repoDir, '.git')
  if (fs.existsSync(repoGitDir))
  {
    return repoDir
  }

  return null
}

const updateYanorraRepo = (repoName: string): void =>
{
  const repoDir = getRepoDir(repoName)
  if (!repoDir)
  {
    console.warn(`Warning: ${repoName} repo not found, skipping git pull --rebase`)
    return
  }

  const originalDir = process.cwd()
  const shouldChangeDir = path.resolve(originalDir) !== path.resolve(repoDir)

  if (shouldChangeDir)
  {
    console.log(`Changing directory to ${repoDir}`)
    process.chdir(repoDir)
  }

  try
  {
    console.log(`Running git pull --rebase in ${repoName} repo...`)
    execSync('git pull --rebase', { stdio: 'inherit' })
  }
  catch (err)
  {
    console.warn(`Warning: git pull --rebase failed in ${repoName} repo`)
  }
  finally
  {
    if (shouldChangeDir)
    {
      console.log(`Changing directory back to ${originalDir}`)
      process.chdir(originalDir)
    }
  }
}

const run = (): void =>
{
  updateYanorraRepo('yanorra-maps')
  updateYanorraRepo('yanorra-wiki')
}

run()
