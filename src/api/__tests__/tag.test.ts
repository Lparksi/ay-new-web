import { describe, it, expect } from 'vitest'
import * as tagApi from '../tag'
import { mockHttpGet, mockHttpPost } from './test-utils'

describe('tag api', () => {
  it('fetches tags with params', async () => {
    const spy = mockHttpGet({ data: { items: [{ id: 1, name: 'a' }], total: 1 } })
    const res = await tagApi.fetchTags({ q: 'a', page: 1, pageSize: 10 })
    expect(spy).toHaveBeenCalledWith('/merchant-tags', { params: { q: 'a', page: 1, pageSize: 10 } })
    expect(res).toEqual({ items: [{ id: 1, name: 'a' }], total: 1 })
    spy.mockRestore()
  })

  it('creates tag', async () => {
    const spy = mockHttpPost({ data: { id: 5, name: 'new' } })
    const res = await tagApi.createTag({ name: 'new' })
    expect(spy).toHaveBeenCalledWith('/merchant-tags', { name: 'new' })
    expect(res).toEqual({ id: 5, name: 'new' })
    spy.mockRestore()
  })
})
