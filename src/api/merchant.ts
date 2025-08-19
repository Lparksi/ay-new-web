import { http } from './index'
import type { Merchant } from '../types'

export interface MerchantListParams {
  page?: number
  pageSize?: number
  q?: string
  tags?: number[]
}

export interface PagedResponse<T> {
  items: T[]
  total: number
}

export async function fetchMerchants(params: MerchantListParams = {}): Promise<PagedResponse<Merchant> | Merchant[]> {
  try {
    const resp = await http.get('/merchants', { params })
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function fetchMerchant(id: number | string): Promise<Merchant> {
  try {
    const resp = await http.get(`/merchants/${id}`)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function createMerchant(payload: Partial<Merchant>) {
  try {
    const resp = await http.post('/merchants', payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function updateMerchant(id: number | string, payload: Partial<Merchant>) {
  try {
    const resp = await http.put(`/merchants/${id}`, payload)
    return resp.data
  } catch (e) {
    throw normalizeError(e)
  }
}

export async function deleteMerchant(id: number | string) {
  try {
    const resp = await http.delete(`/merchants/${id}`)
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
