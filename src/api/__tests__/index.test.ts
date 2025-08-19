import { describe, it, expect } from 'vitest'
import { http } from '../index'

describe('api/index http instance', () => {
  it('has default Content-Type header', () => {
    const hdr = (http.defaults.headers as any)['Content-Type']
    expect(hdr).toBeDefined()
  })

  it('has a baseURL string', () => {
    expect(typeof http.defaults.baseURL).toBe('string')
    expect(typeof http.defaults.baseURL).toBe('string')
  })

  it('registers request and response interceptors', () => {
    // axios exposes interceptors.request.handlers array
    // ensure at least one handler registered for request and response
    // @ts-ignore
    expect(http.interceptors.request.handlers.length).toBeGreaterThan(0)
    // @ts-ignore
    expect(http.interceptors.response.handlers.length).toBeGreaterThan(0)
  })
})
