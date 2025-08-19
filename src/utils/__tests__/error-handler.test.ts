import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError, ErrorType, normalizeError, handleError, withErrorHandling, withRetry } from '../error-handler'

// Mock notification
vi.mock('../notification', () => ({
  notifyError: vi.fn()
}))

describe('Error Handler Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AppError', () => {
    it('creates error with message and code', () => {
      const error = new AppError('Test error', 'TEST_CODE')
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('normalizeError', () => {
    it('handles AppError instances', () => {
      const appError = new AppError('App error', 'APP_CODE')
      const result = normalizeError(appError)
      
      expect(result.message).toBe('App error')
      expect(result.code).toBe('APP_CODE')
    })

    it('handles Axios response errors', () => {
      const axiosError = {
        response: {
          status: 404,
          data: { message: 'Not found' }
        },
        config: {
          url: '/api/test',
          method: 'GET'
        }
      }
      
      const result = normalizeError(axiosError)
      expect(result.message).toBe('Not found')
      expect(result.code).toBe(404)
      expect(result.details?.url).toBe('/api/test')
    })

    it('handles network errors', () => {
      const networkError = {
        request: { timeout: 5000 }
      }
      
      const result = normalizeError(networkError)
      expect(result.message).toBe('网络连接失败，请检查网络设置')
      expect(result.code).toBe(ErrorType.NETWORK)
    })

    it('handles standard Error objects', () => {
      const error = new Error('Standard error')
      const result = normalizeError(error)
      
      expect(result.message).toBe('Standard error')
      expect(result.code).toBe(ErrorType.UNKNOWN)
    })

    it('handles string errors', () => {
      const result = normalizeError('String error')
      expect(result.message).toBe('String error')
      expect(result.code).toBe(ErrorType.UNKNOWN)
    })
  })

  describe('handleError', () => {
    it('processes error and returns error info', () => {
      const error = new Error('Test error')
      const result = handleError(error, false) // don't show notification
      
      expect(result.message).toBe('Test error')
      expect(result.code).toBe(ErrorType.UNKNOWN)
    })
  })

  describe('withErrorHandling', () => {
    it('wraps async function with error handling', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Async error'))
      const wrappedFn = withErrorHandling(mockFn)
      
      await expect(wrappedFn()).rejects.toThrow('Async error')
      expect(mockFn).toHaveBeenCalled()
    })

    it('calls custom error handler when provided', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Custom error'))
      const customHandler = vi.fn()
      const wrappedFn = withErrorHandling(mockFn, customHandler)
      
      await expect(wrappedFn()).rejects.toThrow('Custom error')
      expect(customHandler).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('withRetry', () => {
    it('retries on network errors', async () => {
      let attempts = 0
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          const error = { request: {} } // network error
          throw error
        }
        return 'success'
      })
      
      const result = await withRetry(mockFn, 3, 10) // short delay for testing
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('does not retry on non-network errors', async () => {
      let attempts = 0
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++
        throw new Error('Validation error')
      })
      
      await expect(withRetry(mockFn, 3, 10)).rejects.toThrow('Validation error')
      expect(attempts).toBe(1) // should not retry
    })

    it('throws last error after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue({ request: {} })
      
      await expect(withRetry(mockFn, 2, 10)).rejects.toEqual({ request: {} })
      expect(mockFn).toHaveBeenCalledTimes(3) // initial + 2 retries
    })
  })
})