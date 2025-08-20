import { http } from './index'
import type { 
  GeocodeRequest, 
  GeocodeResponse, 
  GeocodeBatchRequest, 
  GeocodeBatchResponse,
  GeocodeError
} from '../types'

/**
 * 单个地址地理编码
 * @param request 地理编码请求
 * @returns 地理编码响应
 */
export async function geocode(request: GeocodeRequest): Promise<GeocodeResponse> {
  try {
    const resp = await http.post('/geocode', request)
    return resp.data.data || resp.data
  } catch (e: any) {
    throw normalizeGeocodeError(e)
  }
}

/**
 * 批量地址地理编码
 * @param request 批量地理编码请求
 * @returns 批量地理编码响应
 */
export async function geocodeBatch(request: GeocodeBatchRequest): Promise<GeocodeBatchResponse> {
  try {
    const resp = await http.post('/geocode/batch', request)
    return resp.data.data || resp.data
  } catch (e: any) {
    throw normalizeGeocodeError(e)
  }
}

/**
 * 统一错误处理
 * @param e 错误对象
 * @returns 标准化的错误
 */
function normalizeGeocodeError(e: any): Error {
  // 如果是地理编码特定错误
  if (e?.response?.data?.msg) {
    const errorMsg = e.response.data.msg
    
    // 解析特定的错误码和消息
    if (errorMsg.includes('UPSTREAM_ERROR')) {
      return new Error('地理编码服务异常，请稍后重试')
    }
    if (errorMsg.includes('QUOTA_LIMITED')) {
      return new Error('地理编码请求过于频繁，请稍后重试')
    }
    if (errorMsg.includes('ADDRESS_NOT_FOUND')) {
      return new Error('未找到该地址的地理位置信息')
    }
    if (errorMsg.includes('VALIDATION_FAILED')) {
      return new Error('地址格式不正确')
    }
    if (errorMsg.includes('NETWORK_TIMEOUT')) {
      return new Error('网络超时，请检查网络连接')
    }
    if (errorMsg.includes('CONFIG_MISSING')) {
      return new Error('地理编码服务配置错误')
    }
    
    return new Error(errorMsg)
  }
  
  // 通用错误处理
  if (e?.response?.data?.message) {
    return new Error(e.response.data.message)
  }
  if (e?.message) {
    return new Error(e.message)
  }
  
  return new Error('地理编码请求失败')
}

/**
 * 格式化地理编码结果用于显示
 * @param result 地理编码结果
 * @returns 格式化的字符串
 */
export function formatGeocodeResult(result: GeocodeResponse): string {
  const parts: string[] = []
  
  if (result.formatted_address) {
    parts.push(result.formatted_address)
  } else {
    if (result.province) parts.push(result.province)
    if (result.city) parts.push(result.city)
    if (result.district) parts.push(result.district)
  }
  
  if (result.level_description) {
    parts.push(`(${result.level_description})`)
  }
  
  return parts.join(' ')
}

/**
 * 获取精度等级的颜色标识
 * @param score 精度分数
 * @returns CSS颜色类名或颜色值
 */
export function getAccuracyColor(score?: number): string {
  if (!score) return '#gray'
  
  if (score <= 20) return '#f56565' // 红色 - 粗略定位
  if (score <= 50) return '#ed8936' // 橙色 - 中等定位  
  if (score <= 85) return '#38a169' // 绿色 - 精确定位
  return '#3182ce' // 蓝色 - 非常精确
}

/**
 * 获取精度等级的图标
 * @param score 精度分数
 * @returns 图标名称
 */
export function getAccuracyIcon(score?: number): string {
  if (!score) return 'location-outline'
  
  if (score <= 20) return 'location-outline'
  if (score <= 50) return 'location'
  if (score <= 85) return 'location-sharp'
  return 'location-sharp'
}
