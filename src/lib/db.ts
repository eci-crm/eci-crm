import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { existsSync, copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── Vercel SQLite workaround ─────────────────────────────────────────────────
// On Vercel, the filesystem is read-only except /tmp.
// We copy the SQLite database to /tmp on cold start so Prisma can use it.
function getDatabaseUrl(): string {
  // If DATABASE_URL is already set in environment, use it
  const envUrl = process.env.DATABASE_URL
  if (!envUrl) return 'file:./db/custom.db'

  // On Vercel (serverless), copy DB to /tmp for read-write access
  if (process.env.VERCEL === '1') {
    const tmpDbPath = '/tmp/custom.db'

    // Only copy if not already there (cold start)
    if (!existsSync(tmpDbPath)) {
      try {
        // Resolve the source DB path relative to the project
        // In Vercel, the project root is the cwd
        const sourcePath = join(process.cwd(), 'db', 'custom.db')
        if (existsSync(sourcePath)) {
          copyFileSync(sourcePath, tmpDbPath)
        }
      } catch {
        // If copy fails, continue with original path
      }
    }

    return `file:${tmpDbPath}`
  }

  return envUrl
}

// Set the resolved DATABASE_URL before creating PrismaClient
const resolvedUrl = getDatabaseUrl()
if (resolvedUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedUrl
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
