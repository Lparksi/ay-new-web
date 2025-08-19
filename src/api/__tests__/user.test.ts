import { describe, it, expect } from 'vitest'
import * as userApi from '../user'
import { mockHttpGet } from './test-utils'

describe('user api', () => {
  it('calls /users with params', async () => {
    const spy = mockHttpGet({ data: { items: [], total: 0 } })
    const res = await userApi.fetchUsers({ page: 1, pageSize: 10, q: 'alice' })
    expect(spy).toHaveBeenCalledWith('/users', { params: { page: 1, pageSize: 10, q: 'alice' } })
    expect(res).toEqual({ items: [], total: 0 })
    spy.mockRestore()
  })

  it('fetches current user', async () => {
    const spy = mockHttpGet({ data: { id: 1, name: 'Bob' } })
    const res = await userApi.fetchCurrentUser()
    expect(spy).toHaveBeenCalledWith('/users/me')
    expect(res).toEqual({ id: 1, name: 'Bob' })
    spy.mockRestore()
  })
})
