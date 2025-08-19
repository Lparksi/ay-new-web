import { describe, it, expect } from 'vitest'
import { validateTaskForm } from '../validation'

describe('validateTaskForm', () => {
  it('valid when minimal fields provided', () => {
    const { valid, errors } = validateTaskForm({ task_name: 'Name', priority: 3 })
    expect(valid).toBe(true)
    expect(errors).toEqual({})
  })

  it('invalid when name is empty', () => {
    const { valid, errors } = validateTaskForm({ task_name: '', priority: 2 })
    expect(valid).toBe(false)
    expect(errors.task_name).toBeTruthy()
  })

  it('invalid when priority out of range', () => {
    const { valid, errors } = validateTaskForm({ task_name: 'ok', priority: 10 })
    expect(valid).toBe(false)
    expect(errors.priority).toBeTruthy()
  })

  it('invalid when end before start', () => {
    const { valid, errors } = validateTaskForm({ task_name: 'ok', priority: 2, plan_start_at: '2025-08-10T10:00:00Z', plan_end_at: '2025-08-09T10:00:00Z' })
    expect(valid).toBe(false)
    expect(errors.plan_end_at).toBeTruthy()
  })
})
