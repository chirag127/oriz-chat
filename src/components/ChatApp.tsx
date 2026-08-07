import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chat, listModels, OzAiError } from '@chirag127/oz-ai'
import { downloadBlob, onDropZone, readAsText } from '@chirag127/oz-file'
import {
  type ChatMessage,
  type Conversation,
  deriveTitle,
  emptyConversation,
  toApiMessages,
} from '../lib/chat'
import { PRESETS, presetById } from '../lib/presets'
import { fileSlug, toJson, toMarkdown } from '../lib/exporter'
import {
  deleteConversation,
  listConversations,
  saveConversation,
} from '../lib/history'

// 'auto' = let oz-ai pick + fail over across its full provider/model space.
// Passing a concrete model to oz-ai pins it and DISABLES model-cycling, so the
// default must stay 'auto' for the failover chain to actually recover.
const DEFAULT_MODEL = 'auto'

type Status = 'idle' | 'thinking' | 'streaming' | 'error'

export default function ChatApp() {
  const [convo, setConvo] = useState<Conversation>(() => emptyConversation(DEFAULT_MODEL))
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [models, setModels] = useState<string[]>([DEFAULT_MODEL])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [presetId, setPresetId] = useState('general')
  const [history, setHistory] = useState<Conversation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [renderMd, setRenderMd] = useState<((s: string) => string) | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const preset = presetById(presetId) ?? PRESETS[0]

  // lazy-load markdown renderer (marked+DOMPurify) once, off the critical path
  useEffect(() => {
    let live = true
    import('../lib/markdown').then((m) => {
      if (live) setRenderMd(() => m.renderMarkdown)
    })
    return () => {
      live = false
    }
  }, [])

  // load model list (all g4f models) with failover; never blocks the UI
  useEffect(() => {
    let live = true
    listModels()
      .then((list) => {
        if (!live) return
        if (list.length) {
          const uniq = Array.from(new Set([DEFAULT_MODEL, ...list]))
          setModels(uniq)
        }
      })
      .finally(() => live && setModelsLoading(false))
    return () => {
      live = false
    }
  }, [])

  // load history index
  const refreshHistory = useCallback(() => {
    listConversations().then(setHistory).catch(() => {})
  }, [])
  useEffect(refreshHistory, [refreshHistory])

  // autoscroll on new content
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [convo.messages, status])

  // drag-drop text/markdown files into the composer
  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    return onDropZone(el, async (files) => {
      const f = files[0]
      if (!f) return
      try {
        const text = await readAsText(f)
        setInput((prev) => (prev ? prev + '\n\n' : '') + text)
        taRef.current?.focus()
      } catch {
        /* ignore unreadable files */
      }
    })
  }, [])

  const persist = useCallback((c: Conversation) => {
    saveConversation(c)
      .then(() => listConversations().then(setHistory))
      .catch(() => {})
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus('idle')
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || status === 'thinking' || status === 'streaming') return
    setError('')

    const now = Date.now()
    const userMsg: ChatMessage = { role: 'user', content: text, ts: now }
    const base: Conversation = {
      ...convo,
      messages: [...convo.messages, userMsg],
      updatedAt: now,
    }
    base.title = base.title === 'New chat' ? deriveTitle(base.messages) : base.title
    setConvo(base)
    setInput('')
    setStatus('thinking')

    const ac = new AbortController()
    abortRef.current = ac

    const apiMsgs = toApiMessages(base.messages, preset.system)
    // Only pin a model when the user picked a concrete one; 'auto' → omit so
    // oz-ai runs its default chain AND cycles the full model space on failure.
    const modelOpt = base.model === DEFAULT_MODEL ? {} : { model: base.model }

    const applyAssistant = (acc: string, aiTs: number) =>
      setConvo((c) => {
        const msgs = [...c.messages]
        const last = msgs[msgs.length - 1]
        if (last?.role === 'assistant') {
          msgs[msgs.length - 1] = { ...last, content: acc }
        } else {
          msgs.push({ role: 'assistant', content: acc, ts: aiTs })
        }
        return { ...c, messages: msgs, updatedAt: Date.now() }
      })

    try {
      const stream = await chat(apiMsgs, {
        ...modelOpt,
        stream: true,
        signal: ac.signal,
      })
      setStatus('streaming')
      let acc = ''
      const aiTs = Date.now()
      for await (const delta of stream) {
        acc += delta
        applyAssistant(acc, aiTs)
      }
      setStatus('idle')
      abortRef.current = null
      setConvo((c) => {
        const done = { ...c, updatedAt: Date.now() }
        persist(done)
        return done
      })
    } catch (e) {
      if (ac.signal.aborted) {
        abortRef.current = null
        setStatus('idle')
        setConvo((c) => {
          persist(c)
          return c
        })
        return
      }
      // Streaming has no model-cycling (oz-ai only cycles non-stream). One
      // retry as a non-streaming completion WITHOUT a pinned model exhausts the
      // whole provider/model space before surfacing an error.
      try {
        setStatus('thinking')
        const reply = await chat(apiMsgs, { signal: ac.signal })
        applyAssistant(reply, Date.now())
        setStatus('idle')
        abortRef.current = null
        setConvo((c) => {
          const done = { ...c, updatedAt: Date.now() }
          persist(done)
          return done
        })
        return
      } catch (e2) {
        abortRef.current = null
        if (ac.signal.aborted) {
          setStatus('idle')
          return
        }
        setStatus('error')
        setError(
          e2 instanceof OzAiError
            ? 'All AI providers are busy right now. Try again in a moment, or switch model.'
            : e2 instanceof Error
              ? e2.message
              : 'Something went wrong.'
        )
      }
    }
  }, [input, status, convo, preset.system, persist])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const newChat = () => {
    stop()
    setConvo(emptyConversation(convo.model))
    setError('')
    setSidebarOpen(false)
    taRef.current?.focus()
  }

  const openConvo = (c: Conversation) => {
    stop()
    setConvo(c)
    setError('')
    setSidebarOpen(false)
  }

  const removeConvo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteConversation(id)
    refreshHistory()
    if (id === convo.id) newChat()
  }

  const exportMd = () => {
    const blob = new Blob([toMarkdown(convo)], { type: 'text/markdown' })
    downloadBlob(blob, `${fileSlug(convo.title)}.md`)
  }
  const exportJson = () => {
    const blob = new Blob([toJson(convo)], { type: 'application/json' })
    downloadBlob(blob, `${fileSlug(convo.title)}.json`)
  }

  const busy = status === 'thinking' || status === 'streaming'
  const empty = convo.messages.length === 0

  const rendered = useMemo(() => {
    if (!renderMd) return null
    return convo.messages.map((m) => (m.role === 'assistant' ? renderMd(m.content) : ''))
  }, [convo.messages, renderMd])

  return (
    <div className="chat-shell">
      <aside className={`chat-side ${sidebarOpen ? 'is-open' : ''}`}>
        <button className="btn btn-accent side-new" onClick={newChat}>
          + New chat
        </button>
        <div className="side-list au-scroll" role="list" aria-label="Chat history">
          {history.length === 0 && <p className="side-empty">No saved chats yet.</p>}
          {history.map((c) => (
            <div
              key={c.id}
              role="listitem"
              className={`side-item ${c.id === convo.id ? 'is-active' : ''}`}
              onClick={() => openConvo(c)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openConvo(c)}
            >
              <span className="side-item__title">{c.title}</span>
              <button
                className="side-item__del"
                aria-label={`Delete ${c.title}`}
                onClick={(e) => removeConvo(c.id, e)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-bar">
          <button
            className="btn icon-btn side-toggle"
            aria-label="Toggle history"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            ☰
          </button>
          <label className="field">
            <span className="field__label">Model</span>
            <select
              className="select"
              value={convo.model}
              onChange={(e) => setConvo((c) => ({ ...c, model: e.target.value }))}
              disabled={busy}
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m === DEFAULT_MODEL ? 'Auto (best available)' : m}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Preset</span>
            <select
              className="select"
              value={presetId}
              onChange={(e) => {
                setPresetId(e.target.value)
                const p = presetById(e.target.value)
                if (p?.seed && !input) setInput(p.seed)
              }}
              disabled={busy}
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <span className={`model-glow ${busy ? 'is-live' : ''}`} title="Active model" aria-hidden />
          <div className="chat-bar__right">
            <button className="btn" onClick={exportMd} disabled={empty} title="Export Markdown">
              ↓ .md
            </button>
            <button className="btn" onClick={exportJson} disabled={empty} title="Export JSON">
              ↓ .json
            </button>
          </div>
        </div>

        <div className={`chat-stream au-scroll${empty ? ' is-empty' : ''}`} ref={scrollRef} aria-live="polite">
          {empty && (
            <div className="empty-state">
              <h2>Start a conversation</h2>
              <p>
                Free AI chat, right in your browser. Pick a model, choose a preset, ask anything.
                Your history stays on this device.
              </p>
              <div className="chip-row">
                {[
                  'Explain quantum entanglement simply',
                  'Write a haiku about the aurora',
                  'Debug this Python error',
                  'Ideas for a weekend project',
                ].map((s) => (
                  <button key={s} className="chip" onClick={() => setInput(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {convo.messages.map((m, i) => (
            <div key={i} className={`bubble bubble--${m.role}`}>
              <div className="bubble__role">{m.role === 'user' ? 'You' : 'Assistant'}</div>
              {m.role === 'assistant' && rendered && rendered[i] ? (
                <div
                  className="bubble__body md"
                  dangerouslySetInnerHTML={{ __html: rendered[i] }}
                />
              ) : (
                <div className="bubble__body">{m.content}</div>
              )}
            </div>
          ))}

          {status === 'thinking' && (
            <div className="bubble bubble--assistant">
              <div className="bubble__role">Assistant</div>
              <div className="bubble__body typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="chat-error" role="alert">
            {error}
          </div>
        )}

        <div className="composer" ref={dropRef}>
          <textarea
            ref={taRef}
            className="composer__input au-scroll"
            placeholder="Message the aurora…  (Enter to send · Shift+Enter for newline · drop a .txt/.md file)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            aria-label="Message"
          />
          {busy ? (
            <button className="btn btn-stop" onClick={stop}>
              Stop
            </button>
          ) : (
            <button className="btn btn-accent" onClick={send} disabled={!input.trim()}>
              Send
            </button>
          )}
        </div>
        {modelsLoading && <p className="hint">Loading full model list…</p>}
      </section>
    </div>
  )
}
