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

export function mapUserBackendToFrontend(it: any) {
  return {
    id: it.ID ?? it.id,
    username: it.username ?? it.user_name ?? it.name ?? '',
    full_name: it.full_name ?? it.FullName ?? it.name ?? '',
    email: it.email ?? it.Email ?? '',
    phone: it.phone ?? it.Phone ?? '',
    active: typeof it.active !== 'undefined' ? it.active : (typeof it.Active !== 'undefined' ? it.Active : true),
    roles: it.roles ?? it.Roles ?? [],
    created_at: it.CreatedAt ?? it.created_at,
    updated_at: it.UpdatedAt ?? it.updated_at,
    _raw: it,
  }
}
