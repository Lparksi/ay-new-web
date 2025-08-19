// 角色接口定义
export interface Role {
  id: number
  name: string
  display_name: string
  description?: string
  permissions?: Permission[]
  created_at?: string
  updated_at?: string
}

// 权限接口定义
export interface Permission {
  id: number
  name: string
  description?: string
  category?: string
  created_at?: string
  updated_at?: string
}

// 用户接口定义 - 与后端模型对齐
export interface User {
  id: number
  username: string
  full_name?: string
  active?: boolean
  role?: string // 向后兼容的单角色字段
  roles?: Role[] // 多角色支持
  permissions?: Permission[] // 用户直接权限
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
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
