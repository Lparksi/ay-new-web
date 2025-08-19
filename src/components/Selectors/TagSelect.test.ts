import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TagSelect from './TagSelect.vue'
import * as api from '../../api/tag'

describe('TagSelect', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads options and emits change', async () => {
    const fake = { items: [{ id: 11, name: 't1' }, { id: 12, name: 't2' }] }
    const spy = vi.spyOn(api, 'fetchTags').mockResolvedValue(fake as any)
    const wrapper = mount(TagSelect)

    // wait for mounted load (poll a few ticks to avoid timing flakes)
    let loaded = false
    for (let i = 0; i < 10; i++) {
      await wrapper.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 0))
      if ((wrapper.vm as any).options && (wrapper.vm as any).options.length > 0) {
        loaded = true
        break
      }
    }

    expect(loaded).toBe(true)

    // simulate selection by calling the component's onChange with string ids
    await (wrapper.vm as any).onChange(['11'])

    expect(wrapper.emitted()).toHaveProperty('update:modelValue')
    const emitted = wrapper.emitted('update:modelValue')![0][0] as any[]
    const emittedNums = (emitted || []).map((v: any) => Number(v))
    expect(emittedNums).toContain(11)

    spy.mockRestore()
  })
})
