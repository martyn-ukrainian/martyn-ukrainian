import fs from 'node:fs'
import path from 'node:path'
import { projects } from './projects'

let _cached: string | null = null

/**
 * Concatenate every MDX page (plus the profile README) into one string,
 * keyed by URL path so the assistant can cite real routes. Loaded once per
 * server lifetime — content only changes on redeploy, so no vector search is
 * needed for this volume.
 */
export function getSiteContext(): string {
  if (_cached) return _cached

  const root = process.cwd()
  const sections: string[] = []

  // Profile README — the canonical source of the skills/experience data.
  try {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
    sections.push(`\n\n=== /profile (README.md) ===\n${readme}`)
  } catch {
    /* README is optional */
  }

  const pagesDir = path.join(root, 'pages')
  const walk = (dir: string, urlPrefix: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name === 'api') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full, `${urlPrefix}/${entry.name}`)
        continue
      }
      if (!entry.name.endsWith('.mdx')) continue
      const slug = entry.name.replace(/\.mdx$/, '')
      const url = slug === 'index' ? urlPrefix || '/' : `${urlPrefix}/${slug}`
      const raw = fs.readFileSync(full, 'utf8')
      sections.push(`\n\n=== ${url} ===\n${raw}`)
    }
  }
  walk(pagesDir, '')

  // Project write-ups live in TS, not MDX — the landing page renders them
  // through <ProjectShowcase />, so feed them in explicitly.
  const projectDocs = projects
    .map(
      (p) =>
        `### ${p.name} (${p.kicker})\n${p.blurb}\nStack: ${p.stack.join(', ')}\nRepo: ${p.repo}`,
    )
    .join('\n\n')
  sections.push(
    `\n\n=== / (open-source projects, rendered on the landing page) ===\n${projectDocs}`,
  )

  _cached = sections.join('\n')
  return _cached
}
