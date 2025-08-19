import { describe, it, expect, vi } from 'vitest'
import { http } from '../index'
import { createTask } from '../task'

describe('task api retry', () => {
  it('retries once on network error', async () => {
    const networkErr = new Error('net')
    // first call rejects (no response), second resolves
    const secondResp = { data: { id: 9 } }
    const spy = vi.spyOn(http, 'post')
      .mockRejectedValueOnce(networkErr)
      .mockResolvedValueOnce(secondResp)

    // call createTask - should not throw and should return secondResp
    const r = await createTask({ type: 'g', task_name: 'x' } as any)
    expect(spy).toHaveBeenCalled()
    expect(r && (r as any).data && (r as any).data.id).toBe(9)
    spy.mockRestore()
  })
})
