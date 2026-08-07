import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Module-scoped opener so the navbar button (or anything else) can open the
// panel with an optional seeded question.
let _open: ((seed?: string) => void) | null = null
export function openAskAssistant(seed?: string) {
  _open?.(seed)
}

const BRAND = '#d97757'
const PANEL_WIDTH_PX = 420

export function AskAssistant() {
  const [isOpen, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    _open = (seed) => {
      setOpen(true)
      if (seed) {
        setInput(seed)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
    return () => {
      _open = null
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, streaming])

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 22 * 10) + 'px'
  }, [input, isOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) setOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || streaming) return
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson?.error || `Chat failed (${res.status})`)
      }
      setMessages((m) => [...m, { role: 'assistant', content: '' }])
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((m) => {
          const copy = [...m]
          const last = copy[copy.length - 1]
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: last.content + chunk }
          }
          return copy
        })
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            '⚠️ ' +
            (e?.message ||
              'Assistant is unavailable. Add ANTHROPIC_API_KEY to .env.local to switch it on.'),
        },
      ])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <>
      <FloatingInputBar
        isOpen={isOpen}
        onSubmit={(text) => {
          setOpen(true)
          send(text)
        }}
      />
      {isOpen && (
        <aside
          aria-label="Ask Martyn's assistant"
          data-ask-assistant=""
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: PANEL_WIDTH_PX,
            maxWidth: '100vw',
            background: 'var(--chat-bg, #fff)',
            borderLeft: '1px solid rgba(128,128,128,0.2)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--chat-fg, #0f172a)',
            zIndex: 100,
            animation: 'slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px 12px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
              <SparkleIcon size={16} />
              Ask Martyn&apos;s AI
            </span>
            <IconButton aria-label="Close" title="Close (Esc)" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </header>

          <p style={{ margin: '0 18px 8px', fontSize: 12, color: 'rgba(128,128,128,0.9)', textAlign: 'center' }}>
            AI-generated answers about Martyn&apos;s work — may contain mistakes.
          </p>

          <div ref={scrollRef} style={{ padding: '12px 18px', overflowY: 'auto', flex: 1 }}>
            {messages.length === 0 ? (
              <EmptyState onPick={(q) => send(q)} />
            ) : (
              messages.map((m, i) => <ChatBubble key={i} message={m} />)
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            style={{ padding: 14, borderTop: '1px solid rgba(128,128,128,0.15)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 6,
                padding: '10px 12px',
                border: '1px solid rgba(128,128,128,0.25)',
                borderRadius: 12,
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask about Martyn's experience…"
                rows={1}
                style={{
                  flex: 1,
                  minHeight: 22,
                  maxHeight: 22 * 10,
                  padding: '2px 4px',
                  fontSize: 14,
                  lineHeight: '22px',
                  fontFamily: 'inherit',
                  border: 0,
                  outline: 'none',
                  background: 'transparent',
                  color: 'inherit',
                  resize: 'none',
                  overflowY: 'auto',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                title="Send"
                aria-label="Send"
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: input.trim() && !streaming ? BRAND : 'rgba(128,128,128,0.2)',
                  color: 'white',
                  border: 0,
                  borderRadius: '50%',
                  cursor: input.trim() && !streaming ? 'pointer' : 'default',
                  transition: 'background 150ms',
                }}
              >
                {streaming ? '…' : <SendIcon />}
              </button>
            </div>
          </form>
        </aside>
      )}
      {/* Keep this CSS free of apostrophes and angle brackets — React escapes
          them server-side but not client-side, which breaks hydration. Hence
          the data attribute selector rather than the aria-label. */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (prefers-color-scheme: dark) {
          aside[data-ask-assistant] {
            --chat-bg: #111111;
            --chat-fg: #ededed;
          }
        }
      `}</style>
    </>
  )
}

function FloatingInputBar({
  isOpen,
  onSubmit,
}: {
  isOpen: boolean
  onSubmit: (text: string) => void
}) {
  const [value, setValue] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 20 * 6) + 'px'
  }, [value])
  if (isOpen) return null
  const submit = () => {
    const t = value.trim()
    if (!t) return
    setValue('')
    onSubmit(t)
  }
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        style={{
          pointerEvents: 'auto',
          width: 'min(560px, calc(100% - 32px))',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          padding: '12px 16px',
          fontSize: 14,
          background: 'var(--bar-bg, white)',
          color: 'var(--bar-fg, #475569)',
          border: '1px solid rgba(128,128,128,0.25)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', height: 20 }}>
          <SparkleIcon />
        </span>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Ask my AI anything about my work…"
          aria-label="Ask a question"
          rows={1}
          style={{
            flex: 1,
            minHeight: 20,
            maxHeight: 20 * 6,
            padding: 0,
            border: 0,
            outline: 'none',
            background: 'transparent',
            color: 'inherit',
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: '20px',
            resize: 'none',
            overflowY: 'auto',
          }}
        />
        <kbd
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            padding: '2px 6px',
            background: 'rgba(128,128,128,0.15)',
            borderRadius: 4,
            opacity: value.trim() ? 0 : 1,
            transition: 'opacity 120ms',
          }}
        >
          ⌘/
        </kbd>
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Send"
          title="Send"
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: value.trim() ? BRAND : 'transparent',
            color: value.trim() ? 'white' : 'rgba(128,128,128,0.5)',
            border: 0,
            borderRadius: '50%',
            cursor: value.trim() ? 'pointer' : 'default',
            transition: 'background 150ms',
          }}
        >
          <SendIcon />
        </button>
      </form>
      <style>{`
        @media (prefers-color-scheme: dark) {
          form { --bar-bg: rgba(20,20,20,0.9); --bar-fg: #cbd5e1; }
        }
      `}</style>
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const samples = [
    'What is Martyn best at?',
    'Tell me about his voice AI experience.',
    'What is he learning right now?',
    'What is the Claude-mentor method?',
  ]
  return (
    <div style={{ color: 'rgba(128,128,128,0.95)', fontSize: 13 }}>
      <p style={{ margin: '4px 0 12px' }}>
        Hi! I&apos;m Martyn&apos;s AI. I know his portfolio and ML journal. Ask me anything 👇
      </p>
      <div style={{ display: 'grid', gap: 6 }}>
        {samples.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            style={{
              padding: '9px 12px',
              background: 'rgba(217,119,87,0.08)',
              border: '1px solid rgba(217,119,87,0.22)',
              borderRadius: 8,
              textAlign: 'left',
              cursor: 'pointer',
              color: 'inherit',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div
      style={{
        margin: '10px 0',
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          maxWidth: '90%',
          padding: '9px 13px',
          borderRadius: 12,
          background: isUser ? BRAND : 'rgba(128,128,128,0.12)',
          color: isUser ? 'white' : 'inherit',
          fontSize: 13.5,
          lineHeight: 1.55,
          overflowWrap: 'anywhere',
          minWidth: 0,
        }}
      >
        {isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
        ) : message.content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a({ href, children }) {
                const external = /^https?:\/\//.test(href || '')
                return (
                  <a
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer' : undefined}
                    style={{ color: BRAND, textDecoration: 'underline' }}
                  >
                    {children}
                  </a>
                )
              },
              p({ children }) {
                return <p style={{ margin: '6px 0' }}>{children}</p>
              },
              ul({ children }) {
                return <ul style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ul>
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          '…'
        )}
      </div>
    </div>
  )
}

function IconButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 0,
        borderRadius: 6,
        cursor: props.disabled ? 'default' : 'pointer',
        color: 'inherit',
        opacity: props.disabled ? 0.4 : 0.7,
      }}
    >
      {children}
    </button>
  )
}

export function SparkleIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5l1.4 3.6L13 6.5l-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4L8 1.5z"
        fill={BRAND}
      />
      <path d="M13 10.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6z" fill={BRAND} opacity="0.6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2V12M3 6L7 2L11 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
