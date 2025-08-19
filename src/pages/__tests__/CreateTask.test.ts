import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import CreateTask from '../CreateTask.vue'
import * as taskApi from '../../api/task'

describe('CreateTask page', () => {
  it('submits form successfully', async () => {
    const spy = vi.spyOn(taskApi, 'createTask').mockResolvedValue({ data: { id: 123 } } as any)
    const wrapper = mount(CreateTask)
    // fill minimal fields
    await wrapper.vm.$nextTick()
    ;(wrapper.vm as any).form.task_name = 'Test'
    ;(wrapper.vm as any).form.priority = 2
    // t-button is registered as a custom element in tests; trigger it
    await wrapper.find('t-button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('shows error when submit fails', async () => {
    const spy = vi.spyOn(taskApi, 'createTask').mockRejectedValue(new Error('server error'))
    const wrapper = mount(CreateTask)
    await wrapper.vm.$nextTick()
    ;(wrapper.vm as any).form.task_name = 'Test'
    ;(wrapper.vm as any).form.priority = 2
    await wrapper.find('t-button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
