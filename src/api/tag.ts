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
    return resp.data
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
