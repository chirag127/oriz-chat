import { describe, expect, it } from 'vitest'
import { deriveTitle, emptyConversation, newId, toApiMessages, type ChatMessage } from '../src/lib/chat'

const um = (content: string): ChatMessage => ({ role: 'user', content, ts: 0 })
const am = (content: string): ChatMessage => ({ role: 'assistant', content, ts: 0 })

describe('deriveTitle', () => {
  it('uses first user message', () => {
    expect(deriveTitle([um('Hello there'), am('hi')])).toBe('Hello there')
  })
  it('truncates long titles with ellipsis', () => {
    const t = deriveTitle([um('a'.repeat(60))])
    expect(t.length).toBeLessThanOrEqual(43)
    expect(t.endsWith('…')).toBe(true)
  })
  it('collapses whitespace', () => {
    expect(deriveTitle([um('  foo   bar  ')])).toBe('foo bar')
  })
  it('falls back when no user message', () => {
    expect(deriveTitle([am('only ai')])).toBe('New chat')
    expect(deriveTitle([])).toBe('New chat')
  })
})

describe('toApiMessages', () => {
  it('drops timestamps', () => {
    expect(toApiMessages([um('hi')])).toEqual([{ role: 'user', content: 'hi' }])
  })
  it('prepends system prompt when given', () => {
    const out = toApiMessages([um('hi')], 'be nice')
    expect(out[0]).toEqual({ role: 'system', content: 'be nice' })
    expect(out).toHaveLength(2)
  })
  it('ignores blank system prompt', () => {
    expect(toApiMessages([um('hi')], '   ')).toHaveLength(1)
  })
})

describe('newId', () => {
  it('returns unique non-empty ids', () => {
    const a = newId()
    const b = newId()
    expect(a).toBeTruthy()
    expect(a).not.toBe(b)
  })
})

describe('emptyConversation', () => {
  it('creates a fresh conversation with the given model', () => {
    const c = emptyConversation('gpt-4o-mini')
    expect(c.model).toBe('gpt-4o-mini')
    expect(c.messages).toEqual([])
    expect(c.title).toBe('New chat')
    expect(c.id).toBeTruthy()
  })
})
