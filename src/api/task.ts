import { http } from './index'
import type { AxiosResponse } from 'axios'

export interface CreateTaskPayload {
  type: string
  task_name: string
  remarks?: string
  priority?: number
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
  const resp: AxiosResponse<any> = await http.get('/tasks', { params })
  // Expect backend to return { items: [], total: number } in resp.data
  return resp.data
}
