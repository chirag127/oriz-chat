import { describe, expect, it } from 'vitest'
import { fileSlug, toJson, toMarkdown } from '../src/lib/exporter'
import type { Conversation } from '../src/lib/chat'

const convo: Conversation = {
  id: 'x1',
  title: 'My Chat',
  model: 'gpt-4o-mini',
  createdAt: 0,
  updatedAt: 1700000000000,
  messages: [
    { role: 'system', content: 'be nice', ts: 0 },
    { role: 'user', content: 'Hello', ts: 1 },
    { role: 'assistant', content: 'Hi there', ts: 2 },
  ],
}

describe('toMarkdown', () => {
  const md = toMarkdown(convo)
  it('includes title heading', () => {
    expect(md).toContain('# My Chat')
  })
  it('omits system messages', () => {
    expect(md).not.toContain('be nice')
  })
  it('labels user and assistant turns', () => {
    expect(md).toContain('**You:**')
    expect(md).toContain('**Assistant:**')
    expect(md).toContain('Hello')
    expect(md).toContain('Hi there')
  })
})

describe('toJson', () => {
  it('round-trips the conversation', () => {
    expect(JSON.parse(toJson(convo))).toEqual(convo)
  })
})

describe('fileSlug', () => {
  it('slugifies titles', () => {
    expect(fileSlug('My Chat!')).toBe('my-chat')
    expect(fileSlug('  spaced  out  ')).toBe('spaced-out')
  })
  it('falls back to chat when empty', () => {
    expect(fileSlug('!!!')).toBe('chat')
    expect(fileSlug('')).toBe('chat')
  })
})
