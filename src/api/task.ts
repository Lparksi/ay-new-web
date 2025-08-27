import { http } from './index'
import type { AxiosResponse } from 'axios'

export interface CreateTaskPayload {
  type: 'visit' | 'survey' | 'audit' | 'onboarding'
  task_name: string
  remarks?: string
  priority?: number
  status?: number
  scope_json?: string
  plan_start_at?: string | null
  plan_end_at?: string | null
  assigner_id?: number | null
  group_id?: number | null
}

export async function createTask(payload: CreateTaskPayload): Promise<AxiosResponse<any>> {
  // Try once; on network-like error (no response) retry one time
  try {
    const resp = await http.post('/tasks', payload)
    return resp
  } catch (err: any) {
    // if error has no response (network) then retry once
    if (!err || !err.response) {
      const resp = await http.post('/tasks', payload)
      return resp
    }
    throw err
  }
}

export async function fetchTasks(params = {}) {
  const resp = await http.get('/tasks', { params })
  return resp.data
}

export interface FetchTasksParams {
  page?: number
  pageSize?: number
  [key: string]: any
}

export async function fetchTasksPaged(params: FetchTasksParams = {}): Promise<any> {
  // if params is empty, call the dedicated /tasks/my endpoint which reads user from JWT
  const url = Object.keys(params).length === 0 ? '/tasks/my' : '/tasks'
  const resp: AxiosResponse<any> = await http.get(url, { params })
  // backend uses standard response wrapper: { code: 0, msg: 'success', data: { items: [], total: N } }
  if (resp.data && resp.data.code === 0) {
    return resp.data.data || resp.data
  }
  // fallback: if server already responded with {items, total}
  if (resp.data && (resp.data.items || resp.data.total !== undefined)) {
    return resp.data
  }
  return { items: [], total: 0 }
}

export async function updateTask(id: number, payload: Partial<CreateTaskPayload>): Promise<AxiosResponse<any>> {
  const resp = await http.put(`/tasks/${id}`, payload)
  return resp
}

export async function generateTaskMerchants(id: number, merchantIds: number[], assignedTo?: number | null, targetSubTaskCount?: number, options?: { replace?: boolean }): Promise<AxiosResponse<any>> {
  const payload: any = {
    merchant_ids: merchantIds,
  }
  if (assignedTo !== undefined) payload.assigned_to = assignedTo
  if (targetSubTaskCount !== undefined) payload.target_subtask_count = targetSubTaskCount
  if (options?.replace) payload.replace = true
  const resp = await http.post(`/tasks/${id}/merchants`, payload)
  return resp
}

export async function deleteTask(id: number): Promise<AxiosResponse<any>> {
  const resp = await http.delete(`/tasks/${id}`)
  return resp
}

export async function assignTask(id: number, assigneeId: number): Promise<AxiosResponse<any>> {
  const resp = await http.patch(`/tasks/${id}/assign`, { assignee_id: assigneeId })
  return resp
}

export async function updateTaskStatus(id: number, status: number): Promise<AxiosResponse<any>> {
  const resp = await http.patch(`/tasks/${id}/status`, { status })
  return resp
}

export async function exportTasks(params: any = {}): Promise<AxiosResponse<Blob>> {
  const resp = await http.get('/tasks/export', { 
    params,
    responseType: 'blob'
  })
  return resp
}

export async function fetchTaskProgress(id: number): Promise<AxiosResponse<any>> {
  const resp = await http.get(`/tasks/${id}/progress`)
  return resp
}

export async function fetchTaskMerchants(id: number, params: any = {}): Promise<any> {
  const resp: AxiosResponse<any> = await http.get(`/tasks/${id}/merchants`, { params })
  if (resp.data && resp.data.code === 0) {
    return resp.data.data || resp.data
  }
  if (resp.data && (resp.data.items || resp.data.total !== undefined)) {
    return resp.data
  }
  return { items: [], total: 0 }
}

export async function transitionTask(id: number, action: string): Promise<AxiosResponse<any>> {
  const resp = await http.post(`/tasks/${id}/transition`, { action })
  return resp
}
