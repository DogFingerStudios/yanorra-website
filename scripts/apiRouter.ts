import * as fs from 'fs'
import * as path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

interface ApiContext
{
  req: IncomingMessage
  res: ServerResponse
  rootDir: string
  pathName: string
  method: string
}

type ApiHandler = (context: ApiContext) => void

interface ApiRoute
{
  method: string
  path: string
  handler: ApiHandler
}

const API_PREFIX = '/api/v1'

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown): void =>
{
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

const getPathFromRequest = (req: IncomingMessage): string =>
{
  const requestUrl = req.url ?? ''
  const splitUrl = requestUrl.split('?')
  return splitUrl[0] ?? ''
}

const resolveAboutMarkdownPath = (rootDir: string): string =>
{
  const sourcePath = path.resolve(rootDir, 'src', 'content', 'ABOUT.md')

  if (fs.existsSync(sourcePath))
  {
    return sourcePath
  }

  return path.resolve(rootDir, 'public', 'ABOUT.md')
}

const handleAbout = (context: ApiContext): void =>
{
  const aboutMarkdownPath = resolveAboutMarkdownPath(context.rootDir)

  if (!fs.existsSync(aboutMarkdownPath))
  {
    sendJson(context.res, 404, { error: 'ABOUT.md not found' })
    return
  }

  const markdown = fs.readFileSync(aboutMarkdownPath, 'utf-8')
  const stats = fs.statSync(aboutMarkdownPath)

  sendJson(context.res, 200, {
    version: 'v1',
    path: context.pathName,
    markdown,
    updatedAt: stats.mtime.toISOString(),
  })
}

const handleVersion = (context: ApiContext): void =>
{
  const packageJsonPath = path.resolve(context.rootDir, 'package.json')

  if (!fs.existsSync(packageJsonPath))
  {
    sendJson(context.res, 500, { error: 'package.json not found' })
    return
  }

  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageJsonContent) as { name?: string; version?: string }

  sendJson(context.res, 200, {
    version: 'v1',
    service: packageJson.name ?? 'yanorra-website',
    appVersion: packageJson.version ?? '0.0.0',
  })
}

const handleQuery = (context: ApiContext): void =>
{
  sendJson(context.res, 501, {
    version: 'v1',
    error: 'Not implemented',
    message: 'Query endpoint is wired and ready for implementation.',
    path: context.pathName,
  })
}

const handleQuery2 = (context: ApiContext): void =>
{
  sendJson(context.res, 200, {
    version: 'v1',
    error: 'Not implemented',
    message: 'You are ok!',
    path: context.pathName,
  })
}

const routes: ApiRoute[] = [
  {
    method: 'GET',
    path: `${API_PREFIX}/about`,
    handler: handleAbout,
  },
  {
    method: 'GET',
    path: `${API_PREFIX}/version`,
    handler: handleVersion,
  },
  {
    method: 'GET',
    path: `${API_PREFIX}/query`,
    handler: handleQuery,
  },
  {
    method: 'POST',
    path: `${API_PREFIX}/query`,
    handler: handleQuery2,
  },
]

export const dispatchApiRequest = (
  req: IncomingMessage,
  res: ServerResponse,
  rootDir: string,
): boolean =>
{
  const pathName = getPathFromRequest(req)

  if (!pathName.startsWith('/api/'))
  {
    return false
  }

  const method = (req.method ?? 'GET').toUpperCase()
  const matchedRoute = routes.find((route) => route.method === method && route.path === pathName)

  if (!matchedRoute)
  {
    sendJson(res, 404, {
      version: 'v1',
      error: 'Endpoint not found',
      method,
      path: pathName,
    })
    return true
  }

  try
  {
    matchedRoute.handler({ req, res, rootDir, pathName, method })
  }
  catch (error)
  {
    console.error(`API handler failed for ${method} ${pathName}`, error)
    sendJson(res, 500, {
      version: 'v1',
      error: 'Internal server error',
      method,
      path: pathName,
    })
  }

  return true
}
