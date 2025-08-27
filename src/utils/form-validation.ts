/**
 * 统一表单验证规则和工具
 */

export interface ValidationRule {
  required?: boolean
  message?: string
  validator?: (value: any) => boolean | string
  trigger?: 'blur' | 'change' | 'submit'
  type?: 'error' | 'warning'
}

export interface ValidationRules {
  [key: string]: ValidationRule[]
}

// 通用验证规则
export const commonRules = {
  required: (message = '此字段为必填项'): ValidationRule => ({
    required: true,
    message,
    trigger: 'change'
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value || value.length < min) {
        return message || `最少需要 ${min} 个字符`
      }
      return true
    },
    trigger: 'change'
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      if (value && value.length > max) {
        return message || `最多允许 ${max} 个字符`
      }
      return true
    },
    trigger: 'change'
  }),

  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) || message
    },
    trigger: 'blur'
  }),

  phone: (message = '请输入有效的手机号码'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      const phoneRegex = /^1[3-9]\d{9}$/
      return phoneRegex.test(value) || message
    },
    trigger: 'blur'
  }),

  range: (min: number, max: number, message?: string): ValidationRule => ({
    validator: (value: number) => {
      if (value == null) return true
      if (value < min || value > max) {
        return message || `值必须在 ${min} 到 ${max} 之间`
      }
      return true
    },
    trigger: 'change'
  }),

  url: (message = '请输入有效的URL地址'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      try {
        new URL(value)
        return true
      } catch {
        return message
      }
    },
    trigger: 'blur'
  }),

  color: (message = '请输入有效的颜色代码'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      return colorRegex.test(value) || message
    },
    trigger: 'blur'
  })
}

// 预定义的表单验证规则
export const formValidationRules = {
  // 用户表单验证
  user: {
    username: [
      commonRules.required('请输入用户名'),
      commonRules.minLength(3, '用户名至少3个字符'),
      commonRules.maxLength(20, '用户名最多20个字符')
    ],
    full_name: [
      commonRules.maxLength(50, '姓名最多50个字符')
    ],
    email: [
      commonRules.email()
    ],
    phone: [
      commonRules.phone()
    ]
  },

  // 商家表单验证
  merchant: {
    name: [
      commonRules.required('请输入商家名称'),
      commonRules.maxLength(200, '商家名称过长')
    ],
    legal_name: [
      {
        required: true,
        message: '请输入法人姓名',
        trigger: 'change'
      },
      {
        validator: (value: string) => {
          if (value && value.trim().length < 2) {
            return '法人姓名至少2个字符'
          }
          if (value && value.length > 100) {
            return '法人姓名最多100个字符'
          }
          return true
        },
        trigger: 'change'
      }
    ],
    phone: [
      {
        validator: (value: string) => {
          if (!value) return true
          const phoneRegex = /^1[3-9]\d{9}$/
          return phoneRegex.test(value) || '请输入有效的手机号码'
        },
        trigger: 'blur'
      }
    ],
    address: [
      {
        validator: (value: string) => {
          if (value && value.length > 200) {
            return '地址最多200个字符'
          }
          return true
        },
        trigger: 'change'
      }
    ],
    city: [
      {
        validator: (value: string) => {
          if (value && value.length > 50) {
            return '城市名称最多50个字符'
          }
          return true
        },
        trigger: 'change'
      }
    ],
    area: [
      {
        validator: (value: string) => {
          if (value && value.length > 50) {
            return '区域名称最多50个字符'
          }
          return true
        },
        trigger: 'change'
      }
    ]
  },

  // 标签表单验证
  tag: {
    name: [
      commonRules.required('请输入标签名称'),
      commonRules.minLength(1, '标签名称不能为空'),
      commonRules.maxLength(50, '标签名称最多50个字符')
    ],
    alias: [
      commonRules.maxLength(10, '别名最多10个字符')
    ],
    class: [
      // 分类为可选字段，但如果有值则需要验证
      commonRules.maxLength(50, '分类最多50个字符')
    ],
    remarks: [
      commonRules.maxLength(500, '备注最多500个字符')
    ]
  },

  // 任务表单验证
  task: {
    task_name: [
      commonRules.required('请输入任务名称'),
      commonRules.minLength(2, '任务名称至少2个字符'),
      commonRules.maxLength(100, '任务名称最多100个字符')
    ],
    remarks: [
      commonRules.maxLength(500, '备注最多500个字符')
    ],
    priority: [
      commonRules.required('请选择优先级'),
      commonRules.range(1, 5, '优先级必须在1-5之间')
    ]
  }
}

// 日期范围验证
export const validateDateRange = (startDate: string | null, endDate: string | null): string | null => {
  if (!startDate || !endDate) return null
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start >= end) {
    return '结束时间必须晚于开始时间'
  }
  
  return null
}

// 异步验证器（用于检查唯一性等）
export const createAsyncValidator = (
  checkFn: (value: string) => Promise<boolean>,
  message: string
) => {
  return {
    validator: async (value: string) => {
      if (!value) return true
      const isValid = await checkFn(value)
      return isValid || message
    },
    trigger: 'blur'
  }
}

export default {
  commonRules,
  formValidationRules,
  validateDateRange,
  createAsyncValidator
}