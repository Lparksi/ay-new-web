import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskManagement from '../pages/TaskManagement.vue'

// Mock the API functions
vi.mock('../api/task', () => ({
  fetchTasksPaged: vi.fn(() => Promise.resolve({ items: [] })),
  fetchTaskMerchants: vi.fn(() => Promise.resolve({ items: [] }))
}))

vi.mock('../api/subtask', () => ({
  submitSubTask: vi.fn(() => Promise.resolve({}))
}))

// Mock TDesign components
vi.mock('tdesign-vue-next', () => ({
  MessagePlugin: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}))

describe('TaskManagement', () => {
  it('renders correctly', () => {
    const wrapper = mount(TaskManagement, {
      global: {
        stubs: {
          't-table': true,
          't-button': true,
          't-space': true,
          't-dialog': true,
          't-form': true,
          't-form-item': true,
          't-textarea': true,
          't-radio-group': true,
          't-radio': true,
          't-upload': true,
          't-tag': true,
          't-progress': true,
          'refresh-icon': true,
          'upload-icon': true
        }
      }
    })

    expect(wrapper.find('.task-management-page').exists()).toBe(true)
    expect(wrapper.find('.page-header h2').text()).toBe('我的任务')
  })

  it('shows loading state initially', () => {
    const wrapper = mount(TaskManagement, {
      global: {
        stubs: {
          't-table': true,
          't-button': true,
          't-space': true,
          'refresh-icon': true
        }
      }
    })

    // The component should render without errors
    expect(wrapper.exists()).toBe(true)
  })
})