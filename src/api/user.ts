import { http } from './index'
import type { User } from '../types'
import { mapUserBackendToFrontend } from './_mappers'

export interface UserListParams {
  page?: number
  pageSize?: number
  q?: string
}

export interface PagedResponse<T> {
  items: T[]
  total: number
}

export async function fetchUsers(params: UserListParams = {}): Promise<PagedResponse<User> | User[]> {
  try {
    const resp = await http.get('/users', { params })
    const d = resp.data
    
    // 根据后端返回结构处理数据
    if (d && d.data && d.data.list && Array.isArray(d.data.list)) {
      // 后端返回格式: { code: 200, msg: "success", data: { list: [], total: 0, page: 1, page_size: 10 } }
      const mappedItems = d.data.list.map(mapUserBackendToFrontend).filter(Boolean) as User[]
      return { 
        items: mappedItems, 
        total: d.data.total || mappedItems.length 
      }
    } else if (d && Array.isArray(d.data)) {
      // 简单数组格式
      const mappedItems = d.data.map(mapUserBackendToFrontend).filter(Boolean) as User[]
      return { items: mappedItems, total: mappedItems.length }
    } else if (Array.isArray(d)) {
      // 直接数组格式
      const mappedItems = d.map(mapUserBackendToFrontend).filter(Boolean) as User[]
      return { items: mappedItems, total: mappedItems.length }
    }
    
    // 默认返回空数组
    return { items: [], total: 0 }
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function fetchCurrentUser(): Promise<User> {
  try {
    const resp = await http.get('/users/me')
    const userData = resp.data.data || resp.data
    const mappedUser = mapUserBackendToFrontend(userData)
    if (!mappedUser) {
      throw new Error('Invalid user data received from server')
    }
    return mappedUser
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function createUser(payload: Partial<User>) {
  try {
    const resp = await http.post('/users', payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function updateUser(id: number | string, payload: Partial<User>) {
  try {
    const resp = await http.put(`/users/${id}`, payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function deleteUser(id: number | string) {
  try {
    const resp = await http.delete(`/users/${id}`)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function updatePassword(payload: { oldPassword: string; newPassword: string }) {
  try {
    const resp = await http.put('/users/me/password', payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

function normalizeError(e: any): Error {
  if (e?.response?.data?.message) return new Error(e.response.data.message)
  if (e?.message) return new Error(e.message)
  return new Error('Unknown API error')
}
