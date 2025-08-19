export interface User {
  id: number
  username: string
  full_name?: string
  email?: string
  phone?: string
  active?: boolean
  roles?: string[]
  created_at?: string
  updated_at?: string
}

export interface Merchant {
  id: number
  name: string
  phone?: string
  address?: string
  tags?: number[]
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface Tag {
  id: number
  name: string
  alias?: string
  class?: string
  remarks?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface Task {
  id?: number
  type: string
  task_name: string
  remarks?: string
  priority?: number
  scope_json?: string
  plan_start_at?: string | null
  plan_end_at?: string | null
  assigner_id?: number | null
  group_id?: number | null
  created_at?: string
  updated_at?: string
}
