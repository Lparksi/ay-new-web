import { describe, it, expect } from 'vitest'
import * as merchantApi from '../merchant'
import { mockHttpGet } from './test-utils'

describe('merchant api', () => {
  it('fetches merchants with params', async () => {
    const spy = mockHttpGet({ data: { items: [{ id: 1 }], total: 1 } })
    const res = await merchantApi.fetchMerchants({ page: 2, pageSize: 5, q: 'shop' })
    expect(spy).toHaveBeenCalledWith('/merchants', { params: { page: 2, pageSize: 5, q: 'shop' } })
    expect(res).toEqual({ items: [{ id: 1 }], total: 1 })
    spy.mockRestore()
  })

  it('fetches single merchant', async () => {
    const spy = mockHttpGet({ data: { id: 10, name: 'M' } })
    const res = await merchantApi.fetchMerchant(10)
    expect(spy).toHaveBeenCalledWith('/merchants/10')
    expect(res).toEqual({ id: 10, name: 'M' })
    spy.mockRestore()
  })
})
