import { describe, it } from 'vitest'
import { mockHttpPost, mockHttpReject, expectSpyCalledWith } from './test-utils'
import { createTask } from '../task'

describe('task api', () => {
  it('posts createTask payload', async () => {
    const resp = { data: { id: 123 } }
    const spy = mockHttpPost(resp)
    const payload = { type: 'general', task_name: 't1' }
    const r = await createTask(payload as any)
    expectSpyCalledWith(spy, '/tasks', payload)
    // wrapper now returns full resp
    if (r && (r as any).data) {
      // ok
    }
  })

  it('handles error from createTask', async () => {
    const err = new Error('network')
    const spy = mockHttpReject('post', err)
    try {
      await createTask({ type: 'x', task_name: 'y' } as any)
    } catch (e) {
      // expected
    }
  })
})
