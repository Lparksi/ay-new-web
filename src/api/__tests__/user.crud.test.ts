import { describe, it, expect } from 'vitest'
import * as userApi from '../user'
import { mockHttpPost, mockHttpPut, mockHttpDelete } from './test-utils'

describe('user api CRUD', () => {
  it('creates user', async () => {
    const payload = { username: 'alice', full_name: 'Alice' }
    const spy = mockHttpPost({ data: { id: 101, username: 'alice', full_name: 'Alice' } })
    const res = await userApi.createUser(payload)
    expect(spy).toHaveBeenCalledWith('/users', payload)
    expect(res).toEqual({ id: 101, username: 'alice', full_name: 'Alice' })
    spy.mockRestore()
  })

  it('updates user', async () => {
    const spy = mockHttpPut({ data: { id: 101, full_name: 'Alice2' } })
    const res = await userApi.updateUser(101, { full_name: 'Alice2' })
    expect(spy).toHaveBeenCalledWith('/users/101', { full_name: 'Alice2' })
    expect(res).toEqual({ id: 101, full_name: 'Alice2' })
    spy.mockRestore()
  })

  it('deletes user', async () => {
    const spy = mockHttpDelete({ data: { success: true } })
    const res = await userApi.deleteUser(101)
    expect(spy).toHaveBeenCalledWith('/users/101')
    expect(res).toEqual({ success: true })
    spy.mockRestore()
  })
})
