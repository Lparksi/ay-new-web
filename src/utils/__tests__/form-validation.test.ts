import { describe, it, expect } from 'vitest'
import { commonRules, validateDateRange, formValidationRules } from '../form-validation'

describe('Form Validation Utils', () => {
  describe('commonRules', () => {
    it('validates required fields', () => {
      const rule = commonRules.required('必填字段')
      expect(rule.required).toBe(true)
      expect(rule.message).toBe('必填字段')
    })

    it('validates minimum length', () => {
      const rule = commonRules.minLength(3)
      expect(rule.validator?.('ab')).toBe('最少需要 3 个字符')
      expect(rule.validator?.('abc')).toBe(true)
      expect(rule.validator?.('abcd')).toBe(true)
    })

    it('validates maximum length', () => {
      const rule = commonRules.maxLength(5)
      expect(rule.validator?.('abc')).toBe(true)
      expect(rule.validator?.('abcde')).toBe(true)
      expect(rule.validator?.('abcdef')).toBe('最多允许 5 个字符')
    })

    it('validates email format', () => {
      const rule = commonRules.email()
      expect(rule.validator?.('')).toBe(true) // empty is valid
      expect(rule.validator?.('test@example.com')).toBe(true)
      expect(rule.validator?.('invalid-email')).toBe('请输入有效的邮箱地址')
    })

    it('validates phone format', () => {
      const rule = commonRules.phone()
      expect(rule.validator?.('')).toBe(true) // empty is valid
      expect(rule.validator?.('13812345678')).toBe(true)
      expect(rule.validator?.('12345678901')).toBe('请输入有效的手机号码')
      expect(rule.validator?.('1381234567')).toBe('请输入有效的手机号码')
    })

    it('validates number range', () => {
      const rule = commonRules.range(1, 5)
      expect(rule.validator?.(3)).toBe(true)
      expect(rule.validator?.(1)).toBe(true)
      expect(rule.validator?.(5)).toBe(true)
      expect(rule.validator?.(0)).toBe('值必须在 1 到 5 之间')
      expect(rule.validator?.(6)).toBe('值必须在 1 到 5 之间')
    })

    it('validates URL format', () => {
      const rule = commonRules.url()
      expect(rule.validator?.('')).toBe(true) // empty is valid
      expect(rule.validator?.('https://example.com')).toBe(true)
      expect(rule.validator?.('http://localhost:3000')).toBe(true)
      expect(rule.validator?.('invalid-url')).toBe('请输入有效的URL地址')
    })

    it('validates color format', () => {
      const rule = commonRules.color()
      expect(rule.validator?.('')).toBe(true) // empty is valid
      expect(rule.validator?.('#FF0000')).toBe(true)
      expect(rule.validator?.('#fff')).toBe(true)
      expect(rule.validator?.('#123ABC')).toBe(true)
      expect(rule.validator?.('FF0000')).toBe('请输入有效的颜色代码')
      expect(rule.validator?.('#GG0000')).toBe('请输入有效的颜色代码')
    })
  })

  describe('validateDateRange', () => {
    it('returns null for valid date range', () => {
      const result = validateDateRange('2023-01-01T10:00:00Z', '2023-01-01T11:00:00Z')
      expect(result).toBeNull()
    })

    it('returns error for invalid date range', () => {
      const result = validateDateRange('2023-01-01T11:00:00Z', '2023-01-01T10:00:00Z')
      expect(result).toBe('结束时间必须晚于开始时间')
    })

    it('returns null for missing dates', () => {
      expect(validateDateRange(null, '2023-01-01T10:00:00Z')).toBeNull()
      expect(validateDateRange('2023-01-01T10:00:00Z', null)).toBeNull()
      expect(validateDateRange(null, null)).toBeNull()
    })
  })

  describe('formValidationRules', () => {
    it('has user validation rules', () => {
      expect(formValidationRules.user.username).toBeDefined()
      expect(formValidationRules.user.email).toBeDefined()
      expect(formValidationRules.user.phone).toBeDefined()
    })

    it('has merchant validation rules', () => {
      expect(formValidationRules.merchant.name).toBeDefined()
      expect(formValidationRules.merchant.phone).toBeDefined()
      expect(formValidationRules.merchant.address).toBeDefined()
    })

    it('has tag validation rules', () => {
      expect(formValidationRules.tag.name).toBeDefined()
      expect(formValidationRules.tag.alias).toBeDefined()
      expect(formValidationRules.tag.class).toBeDefined()
      expect(formValidationRules.tag.remarks).toBeDefined()
    })

    it('has task validation rules', () => {
      expect(formValidationRules.task.task_name).toBeDefined()
      expect(formValidationRules.task.priority).toBeDefined()
      expect(formValidationRules.task.remarks).toBeDefined()
    })
  })
})