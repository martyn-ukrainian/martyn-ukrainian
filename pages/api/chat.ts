import type { NextApiRequest, NextApiResponse } from 'next'
import { getSiteContext } from '../../lib/site-context'

/**
 * Anthropic-backed assistant for the portfolio. Streams plain text to the
 * frontend, which just concatenates chunks (keep that contract if you swap
 * providers).
 *
 * PLACEHOLDER MODE: with no ANTHROPIC_API_KEY set, the route returns a
 * friendly 503 that the chat UI renders inline — the whole panel still works,
 * it just tells you to add a key. Drop `ANTHROPIC_API_KEY=sk-ant-…` into
 * `.env.local` and it goes live, no code change.
 */
const MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are "Martyn's AI" — a friendly, slightly playful assistant embedded in Martyn's portfolio website. You answer questions about Martyn: his skills, experience, and his open ML-learning journey.

# Who Martyn is
A software developer with 9 years of experience. His deep expertise is voice AI and realtime telephony (multi-provider, multi-tenant, browser-to-phone) plus AI/LLM integration (RAG, context engineering, self-hosted inference). He is currently learning ML engineering in public, using Claude Code as a mentor plus a terminal voice agent for verbal reinforcement after each lesson.

# Source of truth
Everything you know about Martyn is in the SITE CONTENT block below (his profile README + every page of this site). Treat it as the single source of truth. If a fact is not there, say you don't know rather than inventing it.

# Rules
1. Answer ONLY questions about Martyn, his work, his skills, or his learning journey. For anything else (general coding help, other people, world facts, chit-chat unrelated to Martyn), politely redirect: "I'm just here to talk about Martyn's work — ask me about his experience or what he's learning!"
2. Never invent employers, project names, dates, tools, or metrics that aren't in the SITE CONTENT.
3. When helpful, link to a relevant page using a Markdown link with a bare path, e.g. [About](/about), [Learning](/learning). Use only paths that appear in the SITE CONTENT.
4. Mirror the user's language: reply in Ukrainian if they write Ukrainian, English if English.
5. Be concise and warm — 2-4 sentences usually. A little personality is welcome; you're on a portfolio, not a spec sheet.

=== SITE CONTENT ===
{{CONTENT}}
=== END SITE CONTENT ===`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(503).json({
      error:
        "The AI assistant isn't switched on yet. Add ANTHROPIC_API_KEY to .env.local (get one at console.anthropic.com) and reload — no code change needed.",
    })
    return
  }

  const { messages } = req.body as { messages: ChatMessage[] }
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array required' })
    return
  }

  // Cap request size so a malicious client can't blow up token cost.
  const MAX_MSG_CHARS = 4000
  const MAX_TURNS = 20
  const clipped = messages.slice(-MAX_TURNS).map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: String(m.content ?? '').slice(0, MAX_MSG_CHARS),
  }))

  const payload = {
    model: MODEL,
    max_tokens: 800,
    temperature: 0.4,
    stream: true,
    system: SYSTEM_PROMPT.replace('{{CONTENT}}', getSiteContext()),
    messages: clipped,
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')
      res.status(upstream.status || 500).json({
        error: `Anthropic ${upstream.status}: ${errText.slice(0, 500) || 'no body'}`,
      })
      return
    }

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Anthropic SSE frames: `event: <type>\ndata: {json}\n\n`.
      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
        if (!dataLine) continue
        const data = dataLine.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const json = JSON.parse(data)
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            res.write(json.delta.text)
          }
        } catch {
          /* ignore keep-alives / malformed frames */
        }
      }
    }
    res.end()
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number }
    console.error('[chat] Anthropic error:', e)
    if (!res.headersSent) {
      res.status(e?.status || 500).json({ error: e?.message || 'Anthropic call failed' })
    } else {
      res.write(`\n\n⚠️ ${e?.message || 'unknown error'}`)
      res.end()
    }
  }
}
