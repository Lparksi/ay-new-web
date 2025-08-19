/**
 * 全局错误处理系统
 */

import { notifyError } from './notification'

export interface ErrorInfo {
  message: string
  code?: string | number
  details?: any
  timestamp: Date
}

export class AppError extends Error {
  public code?: string | number
  public details?: any
  public timestamp: Date

  constructor(message: string, code?: string | number, details?: any) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.timestamp = new Date()
  }
}

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  AUTHORIZATION = 'PERMISSION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// 错误消息映射
const errorMessages: Record<string, string> = {
  [ErrorType.NETWORK]: '网络连接失败，请检查网络设置',
  [ErrorType.VALIDATION]: '输入数据格式不正确',
  [ErrorType.AUTHENTICATION]: '登录已过期，请重新登录',
  [ErrorType.AUTHORIZATION]: '您没有权限执行此操作',
  [ErrorType.NOT_FOUND]: '请求的资源不存在',
  [ErrorType.SERVER]: '服务器内部错误，请稍后重试',
  [ErrorType.UNKNOWN]: '发生未知错误，请联系管理员'
}

// HTTP 状态码到错误类型的映射
const httpStatusToErrorType: Record<number, ErrorType> = {
  400: ErrorType.VALIDATION,
  401: ErrorType.AUTHENTICATION,
  403: ErrorType.AUTHORIZATION,
  404: ErrorType.NOT_FOUND,
  500: ErrorType.SERVER,
  502: ErrorType.NETWORK,
  503: ErrorType.NETWORK,
  504: ErrorType.NETWORK
}

/**
 * 标准化错误对象
 */
export function normalizeError(error: any): ErrorInfo {
  const timestamp = new Date()

  // 如果已经是 AppError
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp
    }
  }

  // 处理 Axios 错误
  if (error?.response) {
    const status = error.response.status
    const errorType = httpStatusToErrorType[status] || ErrorType.UNKNOWN
    const serverMessage = error.response.data?.message || error.response.data?.error
    
    return {
      message: serverMessage || errorMessages[errorType],
      code: status,
      details: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      },
      timestamp
    }
  }

  // 处理网络错误
  if (error?.request) {
    return {
      message: errorMessages[ErrorType.NETWORK],
      code: ErrorType.NETWORK,
      details: { request: error.request },
      timestamp
    }
  }

  // 处理普通 Error 对象
  if (error instanceof Error) {
    return {
      message: error.message,
      code: ErrorType.UNKNOWN,
      details: { stack: error.stack },
      timestamp
    }
  }

  // 处理字符串错误
  if (typeof error === 'string') {
    return {
      message: error,
      code: ErrorType.UNKNOWN,
      timestamp
    }
  }

  // 处理其他类型
  return {
    message: errorMessages[ErrorType.UNKNOWN],
    code: ErrorType.UNKNOWN,
    details: error,
    timestamp
  }
}

/**
 * 全局错误处理器
 */
export function handleError(error: any, showNotification = true): ErrorInfo {
  const errorInfo = normalizeError(error)
  
  // 记录错误到控制台（开发环境）
  if (import.meta.env.DEV) {
    console.error('Error handled:', errorInfo)
  }

  // 显示用户通知
  if (showNotification) {
    notifyError(errorInfo.message)
  }

  // 这里可以添加错误上报逻辑
  // reportError(errorInfo)

  return errorInfo
}

/**
 * 异步操作错误处理装饰器
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  customErrorHandler?: (error: any) => void
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (customErrorHandler) {
        customErrorHandler(error)
      } else {
        handleError(error)
      }
      throw error
    }
  }) as T
}

/**
 * 重试机制
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries) {
        break
      }

      // 只对网络错误进行重试
      const errorInfo = normalizeError(error)
      if (errorInfo.code !== ErrorType.NETWORK && errorInfo.code !== 502 && errorInfo.code !== 503 && errorInfo.code !== 504) {
        break
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }

  throw lastError
}

/**
 * 错误边界组件辅助函数
 */
export function createErrorBoundary() {
  return {
    errorCaptured(error: Error, instance: any, info: string) {
      handleError(error)
      return false // 阻止错误继续传播
    }
  }
}

export default {
  AppError,
  ErrorType,
  normalizeError,
  handleError,
  withErrorHandling,
  withRetry,
  createErrorBoundary
}