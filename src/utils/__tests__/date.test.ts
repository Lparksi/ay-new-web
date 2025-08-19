import { describe, it, expect } from 'vitest'
import { toISOStringOrNull } from '../date'

describe('toISOStringOrNull', () => {
  it('returns ISO string for Date input', () => {
    const d = new Date('2025-01-02T03:04:05Z')
    expect(toISOStringOrNull(d)).toBe('2025-01-02T03:04:05.000Z')
  })

  it('parses ISO string input', () => {
    expect(toISOStringOrNull('2025-01-02T03:04:05Z')).toBe('2025-01-02T03:04:05.000Z')
  })

  it('returns null for invalid input', () => {
    expect(toISOStringOrNull('not a date')).toBeNull()
  })
})
