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
  city?: string          // 城市字段，用于地理编码
  lng?: number          // 经度
  lat?: number          // 纬度
  geocode_level?: string          // 地理编码精度等级
  geocode_score?: number          // 地理编码精度分数
  geocode_description?: string    // 地理编码精度描述
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

// 地理编码相关接口定义
export interface GeocodeRequest {
  address: string
  city?: string
}

export interface GeocodeResponse {
  lng: number
  lat: number
  level?: string
  level_score?: number          // 级别分数，0-100，越高越精确
  level_description?: string    // 精度描述：粗略定位、中等定位、精确定位、非常精确
  province?: string
  city?: string
  district?: string
  formatted_address?: string
}

export interface GeocodeBatchItem {
  address: string
  city?: string
}

export interface GeocodeBatchRequest {
  items: GeocodeBatchItem[]
}

export interface GeocodeError {
  code: string
  message: string
}

export interface GeocodeBatchItemResult {
  index: number
  success: boolean
  error?: GeocodeError
  result?: GeocodeResponse
}

export interface GeocodeBatchResponse {
  results: GeocodeBatchItemResult[]
}

// 地理编码精度等级枚举
export enum GeocodeAccuracyLevel {
  ROUGH = 'rough',        // 粗略定位 (0-20)
  MEDIUM = 'medium',      // 中等定位 (25-50)
  PRECISE = 'precise',    // 精确定位 (55-85)
  VERY_PRECISE = 'very_precise'  // 非常精确 (85-100)
}

// 精度等级描述映射
export const GEOCODE_ACCURACY_DESCRIPTIONS = {
  [GeocodeAccuracyLevel.ROUGH]: '粗略定位',
  [GeocodeAccuracyLevel.MEDIUM]: '中等定位', 
  [GeocodeAccuracyLevel.PRECISE]: '精确定位',
  [GeocodeAccuracyLevel.VERY_PRECISE]: '非常精确'
} as const

// 根据分数获取精度等级的工具函数
export function getAccuracyLevel(score: number): GeocodeAccuracyLevel {
  if (score <= 20) return GeocodeAccuracyLevel.ROUGH
  if (score <= 50) return GeocodeAccuracyLevel.MEDIUM
  if (score <= 85) return GeocodeAccuracyLevel.PRECISE
  return GeocodeAccuracyLevel.VERY_PRECISE
}

// 根据分数获取精度描述的工具函数
export function getAccuracyDescription(score: number): string {
  return GEOCODE_ACCURACY_DESCRIPTIONS[getAccuracyLevel(score)]
}
