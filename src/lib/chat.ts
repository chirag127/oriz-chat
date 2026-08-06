export type Role = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: Role
  content: string
  ts: number
}

export interface Conversation {
  id: string
  title: string
  model: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

/** Stable id — crypto.randomUUID with a fallback for older engines. */
export function newId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** Derive a short title from the first user message. Pure. */
export function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'New chat'
  const t = first.content.trim().replace(/\s+/g, ' ')
  return t.length > 42 ? t.slice(0, 42).trimEnd() + '…' : t || 'New chat'
}

/** Build the message array sent to the model (drops timestamps). Pure. */
export function toApiMessages(
  messages: ChatMessage[],
  system?: string
): { role: Role; content: string }[] {
  const out = messages.map((m) => ({ role: m.role, content: m.content }))
  if (system && system.trim()) {
    return [{ role: 'system' as Role, content: system.trim() }, ...out]
  }
  return out
}

export function emptyConversation(model: string): Conversation {
  const now = Date.now()
  return {
    id: newId(),
    title: 'New chat',
    model,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}
