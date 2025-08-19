import { vi, afterEach, expect } from 'vitest'
import { http } from '../index'

const _spies: any[] = []

function registerSpy(spy: any) {
  _spies.push(spy)
  return spy
}

export function mockHttpGet(result: any) {
  const spy = vi.spyOn(http, 'get').mockResolvedValue(result)
  return registerSpy(spy)
}

export function mockHttpPost(result: any) {
  const spy = vi.spyOn(http, 'post').mockResolvedValue(result)
  return registerSpy(spy)
}

export function mockHttpPut(result: any) {
  const spy = vi.spyOn(http, 'put').mockResolvedValue(result)
  return registerSpy(spy)
}

export function mockHttpDelete(result: any) {
  const spy = vi.spyOn(http, 'delete').mockResolvedValue(result)
  return registerSpy(spy)
}

export function mockHttpReject(method: 'get'|'post'|'put'|'delete', err: any) {
  const spy = vi.spyOn(http, method as any).mockRejectedValue(err)
  return registerSpy(spy)
}

export function restoreAllMocks() {
  while (_spies.length) {
    const s = _spies.pop()
    try { s.mockRestore() } catch (e) { /* ignore */ }
  }
}

// auto cleanup after each test so individual tests don't need to call mockRestore
afterEach(() => {
  restoreAllMocks()
})

// Assertion helpers
export function expectSpyCalled(spy: any) {
  expect(spy).toHaveBeenCalled()
}

export function expectSpyCalledWith(spy: any, ...args: any[]) {
  expect(spy).toHaveBeenCalledWith(...args)
}

