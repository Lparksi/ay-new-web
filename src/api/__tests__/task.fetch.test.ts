import { describe, it, expect, vi } from 'vitest'
import { http } from '../index'
import { fetchTasksPaged } from '../task'

describe('task fetch paged', () => {
  it('calls /tasks with pagination params and returns data', async () => {
    const fakeResp = { data: { items: [{ id: 1 }], total: 1 } }
    const spy = vi.spyOn(http, 'get').mockResolvedValueOnce(fakeResp)
    const res = await fetchTasksPaged({ page: 2, pageSize: 10 })
    expect(spy).toHaveBeenCalledWith('/tasks', { params: { page: 2, pageSize: 10 } })
    expect(res && res.items && res.items.length).toBe(1)
    spy.mockRestore()
  })
})
