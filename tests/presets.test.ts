import { describe, expect, it } from 'vitest'
import { PRESETS, presetById } from '../src/lib/presets'

describe('presets', () => {
  it('every preset has a non-empty system prompt and unique id', () => {
    const ids = new Set<string>()
    for (const p of PRESETS) {
      expect(p.system.trim().length).toBeGreaterThan(0)
      expect(p.label.length).toBeGreaterThan(0)
      expect(ids.has(p.id)).toBe(false)
      ids.add(p.id)
    }
  })
  it('presetById finds and misses correctly', () => {
    expect(presetById('code')?.label).toBe('Code helper')
    expect(presetById('nope')).toBeUndefined()
  })
})
