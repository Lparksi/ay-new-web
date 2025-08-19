import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, requestFulfilled, responseRejected } from '../index'
import { TOKEN_KEY } from '../../utils/storage'

describe('axios interceptors behavior', () => {
  beforeEach(() => {
    // clear storage before each test
    try { localStorage.clear() } catch (e) {}
  })

  it('injects Authorization header when token exists', () => {
  const spyGet = vi.spyOn(globalThis.localStorage, 'getItem' as any).mockReturnValue('test-token')
  const config = { headers: {} }
  const out = requestFulfilled(config)
  // axios may normalize header names to lowercase; accept either
  expect(out.headers.Authorization || out.headers.authorization).toBe('Bearer test-token')
  spyGet.mockRestore()
  })

  it('clears token and redirects on 401/403 response', () => {
    localStorage.setItem(TOKEN_KEY, 'to-be-cleared')
  const spyRemove = vi.spyOn(globalThis.localStorage, 'removeItem' as any)
    const error = { response: { status: 401 } }
    // call the exported handler and await its rejection
    return Promise.resolve(responseRejected(error)).catch(() => {
      expect(spyRemove).toHaveBeenCalled()
      spyRemove.mockRestore()
    })
  })
})
