# Portfolio site (martyn-portfolio)

A [Nextra 3](https://nextra.site) (Next.js + MDX) portfolio & open ML-learning
journal, with a built-in AI assistant. All content is Markdown/MDX — edit the
files in `pages/` and the site updates.

> `README.md` in this repo is the **GitHub profile README** and is intentionally
> separate from the site. This file (`SITE.md`) documents the site app.

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
```

### Turn on the AI assistant (optional)

The chat works with no key — it just tells visitors it's off. To make it live:

```bash
cp .env.local.example .env.local
# then edit .env.local and paste your key:
#   ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at <https://console.anthropic.com/>. Restart `npm run dev`. The
assistant (model `claude-haiku-4-5`) answers questions about your profile and
learning journal, using every MDX page + `README.md` as its context.

## Structure

| Path | What |
| --- | --- |
| `pages/index.mdx` | Landing / hero |
| `pages/about.mdx` | Bio & experience |
| `pages/skills.mdx` | Tech stack tables |
| `pages/learning/index.mdx` | ML roadmap (7 phases) |
| `pages/learning/method.mdx` | Claude-mentor + voice method |
| `pages/learning/phase-2-classical-ml.mdx` | Journal entry (template for new ones) |
| `pages/api/chat.ts` | Anthropic-backed streaming chat endpoint |
| `components/AskAssistant.tsx` | Slide-in chat panel + floating ask bar |
| `components/ProjectShowcase.tsx` | Open-source section — demo player + write-up per project |
| `components/Logo.tsx` | Brand mark |
| `lib/projects.ts` | Project copy + which demo file each one plays |
| `public/demos/` | The recordings, plus a guide to making them |
| `lib/site-context.ts` | Loads all MDX + README into the AI's system prompt |
| `theme.config.tsx` | Nextra theme (branding, colors, nav) |
| `styles/globals.css` | Hero / card / progress-bar styles |
| `pages/_meta.tsx` | Top-level nav order + external links |

## Adding a project demo

Record it, drop it in `public/demos/`, and point the project's `media` field in
`lib/projects.ts` at the file — `{ kind: 'cast' }` for an asciinema recording,
`{ kind: 'video' }` for MP4/WebM. Until then it shows a "demo coming soon"
placeholder of the same size, so the layout never shifts. Recording commands
and size limits are in [`public/demos/README.md`](./public/demos/README.md).

Nothing loads until a visitor presses play: the asciinema player bundle is a
dynamic import and videos are `preload="none"`.

## Adding a journal entry

1. Create `pages/learning/phase-N-something.mdx` (copy phase-2 as a template).
2. Add it to `pages/learning/_meta.tsx` and link it from `learning/index.mdx`.
   The AI assistant picks it up automatically on the next server start.

## Deploy (Vercel)

1. Import the repo at <https://vercel.com/new>.
2. Set env var `ANTHROPIC_API_KEY` in the project settings (optional).
3. Deploy — Vercel auto-detects Next.js. No extra config needed.
