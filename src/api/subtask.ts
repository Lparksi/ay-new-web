import { http } from './index'
import type { AxiosResponse } from 'axios'

export interface SubmitSubTaskPayload {
  task_id: number
  task_merchant_id?: number | null
  merchant_id?: number | null
  submitter_id: number
  content?: string
  client_mark?: string
  submitted_at?: string
  geopoint_id?: number | null
  attachments?: Array<{ url: string; type: string; meta_json?: string }>
}

export async function submitSubTask(payload: SubmitSubTaskPayload): Promise<AxiosResponse<any>> {
  const resp = await http.post('/subtasks', payload)
  return resp
}

export async function confirmSubTask(subtaskId: number, confirm: boolean): Promise<AxiosResponse<any>> {
  const resp = await http.post(`/subtasks/${subtaskId}/confirm`, { confirm })
  return resp
}

export interface PresignAttachmentReq {
  file_name: string
  size: number
  mime: string
  biz_type: string
}

export interface PresignAttachmentResp {
  key: string
  host: string
  policy: string
  signature: string
  access_id: string
  expire_at: number
  headers: Record<string, string>
}

export async function presignSubtaskAttachment(subtaskId: number, req: PresignAttachmentReq): Promise<AxiosResponse<PresignAttachmentResp>> {
  const resp = await http.post(`/subtasks/${subtaskId}/attachments/presign`, req)
  return resp
}

export interface ConfirmAttachmentReq {
  key: string
  file_name: string
  size: number
  mime: string
  hash?: string
  biz_type?: string
}

export interface ConfirmAttachmentResp {
  id: number
  file_name: string
  size: number
  mime: string
  url: string
  expire_at: number
  etag: string
}

export async function confirmSubtaskAttachment(subtaskId: number, req: ConfirmAttachmentReq): Promise<AxiosResponse<ConfirmAttachmentResp>> {
  const resp = await http.post(`/subtasks/${subtaskId}/attachments/confirm`, req)
  return resp
}

export async function listSubtaskAttachments(subtaskId: number, page = 1, size = 20): Promise<AxiosResponse<any>> {
  const resp = await http.get(`/subtasks/${subtaskId}/attachments`, { params: { page, size } })
  return resp
}

export interface ListSubTasksParams {
  taskId?: number
  merchantId?: number
  taskMerchantId?: number
  submitterId?: number
  clientMark?: string
  confirmed?: boolean
  page?: number
  size?: number
}

export async function listSubTasks(params: ListSubTasksParams = {}): Promise<AxiosResponse<any>> {
  const resp = await http.get('/subtasks', { params })
  return resp
}
