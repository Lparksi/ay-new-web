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
  // 处理标签数据：将标签对象数组转换为ID数组
  let tags: number[] = []
  if (Array.isArray(it.tags)) {
    tags = it.tags.map((tag: any) => {
      // 如果是对象，提取ID；如果是数字，直接使用
      return typeof tag === 'object' ? (tag.ID || tag.id) : tag
    }).filter((id: any) => id !== null && id !== undefined)
  } else if (Array.isArray(it.TagIDs)) {
    tags = it.TagIDs
  } else if (Array.isArray(it.tag_ids)) {
    tags = it.tag_ids
  }

  return {
    id: it.ID ?? it.id,
    legal_name: it.legal_name ?? it.LegalName ?? '',
    phone: it.phone ?? it.Phone ?? '',
    address: it.address ?? it.Address ?? '',
    city: it.city ?? it.City ?? '',
    area: it.area ?? it.Area ?? '',
    lng: it.lng ?? it.Lng ?? null,
    lat: it.lat ?? it.Lat ?? null,
    geocode_level: it.geocode_level ?? it.GeocodeLevel ?? '',
    geocode_score: it.geocode_score ?? it.GeocodeScore ?? null,
    geocode_description: it.geocode_description ?? it.GeocodeDescription ?? '',
    tags,
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
