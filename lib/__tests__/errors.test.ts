import { describe, it, expect } from 'vitest'
import {
  AppError,
  ErrorCode,
  ValidationError,
  EmptyPromptError,
  ImageRequiredError,
  RateLimitError,
  UsageLimitError,
  AIServiceError,
  parseError,
} from '../errors'

describe('errors', () => {
  describe('AppError', () => {
    it('creates error with all properties', () => {
      const error = new AppError(
        ErrorCode.UNKNOWN_ERROR,
        'Technical message',
        'User message',
        500,
        { foo: 'bar' },
        true
      )

      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(error.message).toBe('Technical message')
      expect(error.userMessage).toBe('User message')
      expect(error.statusCode).toBe(500)
      expect(error.context).toEqual({ foo: 'bar' })
      expect(error.isRetryable).toBe(true)
    })

    it('converts to JSON correctly', () => {
      const error = new AppError(
        ErrorCode.INVALID_INPUT,
        'Tech message',
        'User message',
        400
      )

      const json = error.toJSON()
      expect(json).toEqual({
        code: ErrorCode.INVALID_INPUT,
        message: 'Tech message',
        userMessage: 'User message',
        statusCode: 400,
        isRetryable: false,
        context: undefined,
      })
    })
  })

  describe('ValidationError', () => {
    it('creates validation error with field and issue', () => {
      const error = new ValidationError('email', 'invalid format')

      expect(error.code).toBe(ErrorCode.INVALID_INPUT)
      expect(error.message).toContain('email')
      expect(error.message).toContain('invalid format')
      expect(error.userMessage).toContain('Invalid email')
      expect(error.statusCode).toBe(400)
      expect(error.isRetryable).toBe(false)
      expect(error.context).toEqual({ field: 'email', issue: 'invalid format' })
    })
  })

  describe('EmptyPromptError', () => {
    it('creates empty prompt error', () => {
      const error = new EmptyPromptError()

      expect(error.code).toBe(ErrorCode.EMPTY_PROMPT)
      expect(error.userMessage).toContain('select at least one filter')
      expect(error.statusCode).toBe(400)
      expect(error.isRetryable).toBe(false)
    })
  })

  describe('ImageRequiredError', () => {
    it('creates image required error', () => {
      const error = new ImageRequiredError()

      expect(error.code).toBe(ErrorCode.IMAGE_REQUIRED)
      expect(error.userMessage).toContain('take or upload a photo')
      expect(error.statusCode).toBe(400)
      expect(error.isRetryable).toBe(false)
    })
  })

  describe('RateLimitError', () => {
    it('creates rate limit error with retry time', () => {
      const retryAfter = new Date(Date.now() + 60000) // 1 minute from now
      const error = new RateLimitError(retryAfter, 'test-user')

      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED)
      expect(error.userMessage).toContain('Too many requests')
      expect(error.statusCode).toBe(429)
      expect(error.isRetryable).toBe(true)
      expect(error.context?.identifier).toBe('test-user')
      expect(error.context?.retryAfter).toBe(retryAfter.toISOString())
    })

    it('formats time string for seconds', () => {
      const retryAfter = new Date(Date.now() + 30000) // 30 seconds
      const error = new RateLimitError(retryAfter, 'test')

      expect(error.userMessage).toContain('seconds')
    })

    it('formats time string for minutes', () => {
      const retryAfter = new Date(Date.now() + 120000) // 2 minutes
      const error = new RateLimitError(retryAfter, 'test')

      expect(error.userMessage).toContain('minutes')
    })
  })

  describe('UsageLimitError', () => {
    it('creates usage limit error with reset time', () => {
      const resetsAt = new Date(Date.now() + 3600000) // 1 hour
      const error = new UsageLimitError(5, resetsAt, 0)

      expect(error.code).toBe(ErrorCode.USAGE_LIMIT_EXCEEDED)
      expect(error.userMessage).toContain('daily limit of 5')
      expect(error.userMessage).toContain('Upgrade to Pro')
      expect(error.statusCode).toBe(403)
      expect(error.isRetryable).toBe(false)
      expect(error.context?.limit).toBe(5)
    })
  })

  describe('AIServiceError', () => {
    it('creates AI service error from Error object', () => {
      const originalError = new Error('API timeout')
      const error = new AIServiceError(originalError, 503)

      expect(error.code).toBe(ErrorCode.AI_SERVICE_ERROR)
      expect(error.message).toContain('API timeout')
      expect(error.statusCode).toBe(503)
      expect(error.isRetryable).toBe(true)
    })

    it('creates AI service error from string', () => {
      const error = new AIServiceError('Connection failed', 503)

      expect(error.message).toContain('Connection failed')
      expect(error.statusCode).toBe(503)
    })

    it('uses appropriate user message for 401', () => {
      const error = new AIServiceError('Unauthorized', 401)

      expect(error.userMessage).toContain('authentication error')
      expect(error.isRetryable).toBe(false)
    })

    it('uses appropriate user message for 429', () => {
      const error = new AIServiceError('Rate limited', 429)

      expect(error.userMessage).toContain('busy')
      expect(error.isRetryable).toBe(true)
    })

    it('uses appropriate user message for 5xx', () => {
      const error = new AIServiceError('Internal error', 500)

      expect(error.userMessage).toContain('experiencing issues')
      expect(error.isRetryable).toBe(true)
    })
  })

  describe('parseError', () => {
    it('returns AppError unchanged', () => {
      const original = new ValidationError('test', 'issue')
      const result = parseError(original)

      expect(result).toBe(original)
    })

    it('converts Error to AppError', () => {
      const original = new Error('Something went wrong')
      const result = parseError(original)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(result.message).toBe('Something went wrong')
      expect(result.userMessage).toContain('unexpected error')
      expect(result.statusCode).toBe(500)
    })

    it('converts string to AppError', () => {
      const result = parseError('Error string')

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(result.message).toBe('Error string')
    })

    it('converts unknown type to AppError', () => {
      const result = parseError({ weird: 'object' })

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(result.message).toContain('[object Object]')
    })
  })
})
