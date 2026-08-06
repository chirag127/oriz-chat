import type { Conversation } from './chat'

/** Serialize a conversation to Markdown. Pure. */
export function toMarkdown(c: Conversation): string {
  const date = new Date(c.updatedAt).toISOString()
  const lines: string[] = [
    `# ${c.title}`,
    '',
    `_Model: ${c.model} · ${date}_`,
    '',
  ]
  for (const m of c.messages) {
    if (m.role === 'system') continue
    lines.push(m.role === 'user' ? '**You:**' : '**Assistant:**')
    lines.push('')
    lines.push(m.content.trim())
    lines.push('')
  }
  return lines.join('\n').trimEnd() + '\n'
}

/** Serialize a conversation to portable JSON. Pure. */
export function toJson(c: Conversation): string {
  return JSON.stringify(c, null, 2)
}

/** Filename-safe slug from a title. Pure. */
export function fileSlug(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return s || 'chat'
}
