import { http } from './index'
import type { Role } from '../types'

export interface RoleListParams {
  page?: number
  pageSize?: number
}

export async function fetchRoles(params: RoleListParams = {}): Promise<Role[]> {
  try {
    const resp = await http.get('/roles', { params })
    const d = resp.data
    
    // 处理角色数据
    if (d && Array.isArray(d.data)) {
      return d.data
    } else if (Array.isArray(d)) {
      return d
    }
    
    return []
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function createRole(payload: Partial<Role>) {
  try {
    const resp = await http.post('/roles', payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function updateRole(id: number | string, payload: Partial<Role>) {
  try {
    const resp = await http.put(`/roles/${id}`, payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function deleteRole(id: number | string) {
  try {
    const resp = await http.delete(`/roles/${id}`)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

// 为用户分配角色
export async function assignRoleToUser(userId: number | string, roleId: number) {
  try {
    const resp = await http.post(`/users/${userId}/roles`, { role_id: roleId })
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

// 从用户移除角色
export async function removeRoleFromUser(userId: number | string, roleId: number) {
  try {
    const resp = await http.delete(`/users/${userId}/roles`, { data: { role_id: roleId } })
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
