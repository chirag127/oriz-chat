import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Conversation } from './chat'

interface ChatDB extends DBSchema {
  conversations: {
    key: string
    value: Conversation
    indexes: { 'by-updated': number }
  }
}

let dbp: Promise<IDBPDatabase<ChatDB>> | null = null

function db() {
  if (!dbp) {
    dbp = openDB<ChatDB>('oriz-chat', 1, {
      upgrade(d) {
        const store = d.createObjectStore('conversations', { keyPath: 'id' })
        store.createIndex('by-updated', 'updatedAt')
      },
    })
  }
  return dbp
}

export async function saveConversation(c: Conversation): Promise<void> {
  await (await db()).put('conversations', c)
}

export async function loadConversation(id: string): Promise<Conversation | undefined> {
  return (await db()).get('conversations', id)
}

export async function deleteConversation(id: string): Promise<void> {
  await (await db()).delete('conversations', id)
}

/** All conversations, newest first. */
export async function listConversations(): Promise<Conversation[]> {
  const all = await (await db()).getAllFromIndex('conversations', 'by-updated')
  return all.reverse()
}

export async function clearAll(): Promise<void> {
  await (await db()).clear('conversations')
}
