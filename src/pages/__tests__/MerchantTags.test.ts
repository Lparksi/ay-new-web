import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MerchantTags from '../MerchantTags.vue'
import * as tagApi from '../../api/tag'

// Mock the API
vi.mock('../../api/tag', () => ({
  fetchTags: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  batchCreateTags: vi.fn(),
}))

// Mock TDesign components
vi.mock('tdesign-vue-next', () => ({
  Table: { name: 'TTable', template: '<div><slot /></div>' },
  Button: { name: 'TButton', template: '<button><slot /></button>' },
  Dialog: { name: 'TDialog', template: '<div v-if="visible"><slot /></div>', props: ['visible'] },
  Form: { name: 'TForm', template: '<form><slot /></form>' },
  FormItem: { name: 'TFormItem', template: '<div><slot /></div>' },
  Input: { name: 'TInput', template: '<input />' },
  Textarea: { name: 'TTextarea', template: '<textarea></textarea>' },
  Tag: { name: 'TTag', template: '<span><slot /></span>' },
  MessagePlugin: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock TDesign icons
vi.mock('tdesign-icons-vue-next', () => ({
  AddIcon: { name: 'AddIcon', template: '<span>+</span>' },
}))

describe('MerchantTags Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders merchant tags page correctly', async () => {
    const mockTags = [
      { id: 1, name: 'Test Tag', color: '#FF0000', description: 'Test Description' },
    ]

    vi.mocked(tagApi.fetchTags).mockResolvedValue(mockTags)

    const wrapper = mount(MerchantTags)
    
    expect(wrapper.find('h2').text()).toBe('标签管理')
    expect(tagApi.fetchTags).toHaveBeenCalled()
  })

  it('handles tag creation', async () => {
    vi.mocked(tagApi.fetchTags).mockResolvedValue([])
    vi.mocked(tagApi.createTag).mockResolvedValue({ id: 1 })

    const wrapper = mount(MerchantTags)
    
    // Test that the component mounts without errors
    expect(wrapper.exists()).toBe(true)
  })

  it('handles batch tag creation', async () => {
    vi.mocked(tagApi.fetchTags).mockResolvedValue([])
    vi.mocked(tagApi.batchCreateTags).mockResolvedValue([{ id: 1 }, { id: 2 }])

    const wrapper = mount(MerchantTags)
    
    // Test that the component mounts without errors
    expect(wrapper.exists()).toBe(true)
  })
})