export interface Preset {
  id: string
  label: string
  system: string
  seed?: string
}

/** Built-in prompt presets — set the system prompt + optional starter. */
export const PRESETS: Preset[] = [
  {
    id: 'general',
    label: 'General assistant',
    system: 'You are a helpful, concise assistant. Use markdown when useful.',
  },
  {
    id: 'code',
    label: 'Code helper',
    system:
      'You are an expert software engineer. Give correct, minimal code with short explanations. Use fenced code blocks with language tags.',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    system:
      'You are a creative brainstorming partner. Offer diverse, concrete ideas as short bulleted lists.',
  },
  {
    id: 'explain',
    label: 'Explain simply',
    system:
      'Explain concepts as clearly as possible for a curious beginner. Use analogies and short paragraphs.',
  },
  {
    id: 'rewrite',
    label: 'Rewrite / polish',
    system:
      'You improve writing. Keep the author’s voice, fix grammar, tighten prose, and return only the rewritten text unless asked otherwise.',
    seed: 'Rewrite this to be clearer and more concise:\n\n',
  },
  {
    id: 'translate',
    label: 'Translate',
    system:
      'You are a professional translator. Detect the source language and translate faithfully, preserving tone and formatting.',
  },
]

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
