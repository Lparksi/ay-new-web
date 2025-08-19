import type { User } from '../types'

export function mapTagBackendToFrontend(it: any) {
  return {
    id: it.ID ?? it.id,
    name: it.tag_name ?? it.name ?? '',
    alias: it.alias ?? it.alias_name ?? '',
    class: it.class ?? it.Class ?? it.category ?? '',
    remarks: it.remarks ?? it.description ?? '',
    created_at: it.CreatedAt ?? it.created_at,
    updated_at: it.UpdatedAt ?? it.updated_at,
    deleted_at: it.DeletedAt ?? it.deleted_at ?? null,
    _raw: it,
  }
}

export function mapMerchantBackendToFrontend(it: any) {
  return {
    id: it.ID ?? it.id,
    name: it.name ?? it.merchant_name ?? it.alias ?? '',
    phone: it.phone ?? it.Phone ?? '',
    address: it.address ?? it.Address ?? it.location ?? '',
    tags: it.tags ?? it.TagIDs ?? it.tag_ids ?? [],
    created_at: it.CreatedAt ?? it.created_at,
    updated_at: it.UpdatedAt ?? it.updated_at,
    deleted_at: it.DeletedAt ?? it.deleted_at ?? null,
    _raw: it,
  }
}

export function mapUserBackendToFrontend(it: any): User | null {
  // 基本验证
  if (!it || typeof it !== 'object') {
    console.warn('Invalid user data received:', it)
    return null
  }

  // 确保有基本的 ID
  const id = it.ID ?? it.id
  if (!id) {
    console.warn('User data missing ID:', it)
    return null
  }

  return {
    id,
    username: it.username ?? it.user_name ?? it.name ?? '',
    full_name: it.full_name ?? it.FullName ?? it.name ?? '',
    active: typeof it.active !== 'undefined' ? it.active : (typeof it.Active !== 'undefined' ? it.Active : true),
    role: it.role ?? it.Role ?? '', // 向后兼容的单角色字段
    roles: it.roles ?? it.Roles ?? [], // 多角色支持
    permissions: it.permissions ?? it.Permissions ?? [], // 用户直接权限
    created_at: it.CreatedAt ?? it.created_at,
    updated_at: it.UpdatedAt ?? it.updated_at,
    deleted_at: it.DeletedAt ?? it.deleted_at ?? null,
  } as User
}
