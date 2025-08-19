import { mount } from '@vue/test-utils'
import Users from '../Users.vue'
import * as userApi from '../../api/user'
import { nextTick } from 'vue'

describe('Users page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads and displays users', async () => {
    const fake = { items: [{ id: 1, username: 'alice' }] }
    vi.spyOn(userApi, 'fetchUsers').mockResolvedValue(fake as any)

    const wrapper = mount(Users)
    // wait for onMounted promise
    await nextTick()
    await Promise.resolve()

    expect(userApi.fetchUsers).toHaveBeenCalled()
    // users should be set
    expect(wrapper.findComponent({ name: 'UserList' }).exists()).toBe(true)
  })

  it('creates a user via form', async () => {
    const fake = { items: [{ id: 1, username: 'alice' }] }
    vi.spyOn(userApi, 'fetchUsers').mockResolvedValue(fake as any)
    const createSpy = vi.spyOn(userApi, 'createUser').mockResolvedValue({ id: 2, username: 'bob' } as any)

    const wrapper = mount(Users)
    await nextTick()
    await Promise.resolve()

    const form = wrapper.findComponent({ name: 'UserForm' })
    expect(form.exists()).toBe(true)
    // emit created
    form.vm.$emit('created', { username: 'bob' })
    await Promise.resolve()
    expect(createSpy).toHaveBeenCalledWith({ username: 'bob' })
  })

  it('updates and deletes a user', async () => {
    const fake = { items: [{ id: 1, username: 'alice' }] }
    vi.spyOn(userApi, 'fetchUsers').mockResolvedValue(fake as any)
    const updateSpy = vi.spyOn(userApi, 'updateUser').mockResolvedValue({ id: 1, username: 'alice2' } as any)
    const deleteSpy = vi.spyOn(userApi, 'deleteUser').mockResolvedValue({} as any)

    const wrapper = mount(Users)
    await nextTick()
    await Promise.resolve()

    const list = wrapper.findComponent({ name: 'UserList' })
    expect(list.exists()).toBe(true)
    // simulate edit
    list.vm.$emit('edit', { id: 1, username: 'alice' })
    await Promise.resolve()
    const form = wrapper.findComponent({ name: 'UserForm' })
    // simulate update
    form.vm.$emit('updated', { id: 1, data: { username: 'alice2' } })
    await Promise.resolve()

    expect(updateSpy).toHaveBeenCalledWith(1, { username: 'alice2' })

    // simulate delete
    list.vm.$emit('delete', 1)
    await Promise.resolve()
    expect(deleteSpy).toHaveBeenCalledWith(1)
  })
})
