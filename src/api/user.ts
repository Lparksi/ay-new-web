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
  let rawItems: any[] = []
  if (d && Array.isArray(d.items)) rawItems = d.items
  else if (d && Array.isArray(d.data?.items)) rawItems = d.data.items
  else if (d && Array.isArray(d.data)) rawItems = d.data
  else if (Array.isArray(d)) rawItems = d

  const items = rawItems.map(mapUserBackendToFrontend)
  return { items, total: items.length }
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function fetchCurrentUser(): Promise<User> {
  try {
    const resp = await http.get('/users/me')
    return resp.data as User
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

function normalizeError(e: any): Error {
  if (e?.response?.data?.message) return new Error(e.response.data.message)
  if (e?.message) return new Error(e.message)
  return new Error('Unknown API error')
}
