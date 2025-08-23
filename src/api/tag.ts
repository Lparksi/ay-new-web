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
      name: it.tag_name ?? it.name ?? '',
      alias: it.alias ?? it.alias_name ?? '',
      class: it.class ?? it.Class ?? it.category ?? '',
      remarks: it.remarks ?? it.description ?? '',
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
    // map front-end keys to backend expected keys
    const body = {
      tag_name: payload.name,
      alias: payload.alias,
      class: payload.class,
      remarks: payload.remarks,
    }
    const resp = await http.post('/merchant-tags', body)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function updateTag(id: number | string, payload: Partial<Tag>) {
  try {
  const body: any = {}
  if (payload.name !== undefined) body.tag_name = payload.name
  if (payload.alias !== undefined) body.alias = payload.alias
  if (payload.class !== undefined) body.class = payload.class
  if (payload.remarks !== undefined) body.remarks = payload.remarks
  const resp = await http.put(`/merchant-tags/${id}`, body)
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
    // convert each tag to backend shape
    const payload = tags.map(t => ({
      tag_name: t.name,
      alias: t.alias,
      class: t.class,
      remarks: t.remarks,
    }))

    // Some backends expect an array body for batch endpoints, send array directly
    const resp = await http.post('/merchant-tags/batch', payload)
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
