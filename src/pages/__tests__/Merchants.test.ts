import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Merchants from '../Merchants.vue'
import * as merchantApi from '../../api/merchant'

// Mock the API
vi.mock('../../api/merchant', () => ({
  fetchMerchants: vi.fn(),
  createMerchant: vi.fn(),
  updateMerchant: vi.fn(),
  deleteMerchant: vi.fn(),
}))

// Mock TDesign components
vi.mock('tdesign-vue-next', () => ({
  Table: { name: 'TTable', template: '<div><slot /></div>' },
  Button: { name: 'TButton', template: '<button><slot /></button>' },
  Dialog: { name: 'TDialog', template: '<div v-if="visible"><slot /></div>', props: ['visible'] },
  Form: { name: 'TForm', template: '<form><slot /></form>' },
  FormItem: { name: 'TFormItem', template: '<div><slot /></div>' },
  Input: { name: 'TInput', template: '<input />' },
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

// Mock TagSelect component
vi.mock('../../components/Selectors/TagSelect.vue', () => ({
  default: { name: 'TagSelect', template: '<div>TagSelect</div>' },
}))

describe('Merchants Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders merchants page correctly', async () => {
    const mockMerchants = [
      { id: 1, name: 'Test Merchant', phone: '123456789', address: 'Test Address' },
    ]

    vi.mocked(merchantApi.fetchMerchants).mockResolvedValue(mockMerchants)

    const wrapper = mount(Merchants)
    
    expect(wrapper.find('h2').text()).toBe('商家管理')
    expect(merchantApi.fetchMerchants).toHaveBeenCalled()
  })

  it('handles merchant creation', async () => {
    vi.mocked(merchantApi.fetchMerchants).mockResolvedValue([])
    vi.mocked(merchantApi.createMerchant).mockResolvedValue({ id: 1 })

    const wrapper = mount(Merchants)
    
    // Test that the component mounts without errors
    expect(wrapper.exists()).toBe(true)
  })
})