import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UserSelect from '../UserSelect.vue'
import * as userApi from '../../../api/user'

describe('UserSelect', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads options on mount and emits change on select', async () => {
    const users = { items: [{ id: 1, username: 'alice' }, { id: 2, username: 'bob' }], total: 2 }
    vi.spyOn(userApi, 'fetchUsers').mockResolvedValue(users as any)

    const wrapper = mount(UserSelect)
    // wait for mounted load (poll a few ticks to avoid timing flakes)
    let opts: any[] = []
    for (let i = 0; i < 10; i++) {
      await wrapper.vm.$nextTick()
      // allow promise microtasks to complete
      await new Promise((r) => setTimeout(r, 0))
      opts = wrapper.findAll('option')
      if (opts.length > 0) break
    }

    const select = wrapper.find('[data-test="select"]')
    expect(select.exists()).toBe(true)
    expect(opts.length).toBe(2)

    // select second option
    await select.setValue('2')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([2])
  })

  it('searches and updates options', async () => {
    const usersA = { items: [{ id: 3, username: 'carol' }], total: 1 }
    vi.spyOn(userApi, 'fetchUsers').mockResolvedValue(usersA as any)
    const wrapper = mount(UserSelect)
    await wrapper.vm.$nextTick()

    const input = wrapper.find('[data-test="search"]')
    await input.setValue('carol')
    // simulate input event
    await input.trigger('input')
    await Promise.resolve()

    const options = wrapper.findAll('option')
    expect(options.length).toBe(1)
    expect(options[0].text()).toBe('carol')
  })
})
