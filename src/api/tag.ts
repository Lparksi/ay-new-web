import { http } from './index'
import type { Tag } from '../types'

export interface TagListParams {
  q?: string
  page?: number
  pageSize?: number
  includeDeleted?: boolean
}

export interface PagedResponse<T> {
  items: T[]
  total: number
}

export async function fetchTags(params: TagListParams = {}): Promise<PagedResponse<Tag> | Tag[]> {
  try {
  const resp = await http.get('/merchant-tags', { params })
    const d = resp.data
    // backend may return several shapes: { items:[], total }, { code,msg,data:[...items] }, or direct array
    let rawItems: any[] = []
    if (d && Array.isArray(d.items)) rawItems = d.items
    else if (d && Array.isArray(d.data?.items)) rawItems = d.data.items
    else if (d && Array.isArray(d.data)) rawItems = d.data
    else if (Array.isArray(d)) rawItems = d

    // map backend fields to frontend shape
    const items = rawItems.map((it: any) => ({
      id: it.ID ?? it.id,
      name: it.tag_name ?? it.name ?? it.alias ?? '',
      color: it.color ?? it.class ?? '',
      description: it.remarks ?? it.description ?? '',
      created_at: it.CreatedAt ?? it.created_at,
      updated_at: it.UpdatedAt ?? it.updated_at,
      deleted_at: it.DeletedAt ?? it.deleted_at ?? null,
      // keep original raw object if needed
      _raw: it,
    }))

    return { items, total: items.length }
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function createTag(payload: Partial<Tag>) {
  try {
    const resp = await http.post('/merchant-tags', payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function updateTag(id: number | string, payload: Partial<Tag>) {
  try {
    const resp = await http.put(`/merchant-tags/${id}`, payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function deleteTag(id: number | string) {
  try {
    const resp = await http.delete(`/merchant-tags/${id}`)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function batchCreateTags(tags: Partial<Tag>[]) {
  try {
    const resp = await http.post('/merchant-tags/batch', { tags })
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
