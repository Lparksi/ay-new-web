import { describe, it, expect } from 'vitest'
import * as userApi from '../user'
import { mockHttpReject } from './test-utils'

describe('user api error handling', () => {
  it('normalizes http error into Error with message', async () => {
    const err = { response: { data: { message: 'Not found' } } }
    const spy = mockHttpReject('get', err)
    await expect(userApi.fetchUsers()).rejects.toThrow('Not found')
    spy.mockRestore()
  })

  it('handles generic error', async () => {
    const err = new Error('net fail')
    const spy = mockHttpReject('get', err)
    await expect(userApi.fetchUsers()).rejects.toThrow('net fail')
    spy.mockRestore()
  })
})
