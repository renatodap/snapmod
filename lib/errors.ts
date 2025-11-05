/**
 * Error hierarchy for SnapMod
 *
 * Provides structured error handling with:
 * - Error codes for classification
 * - User-friendly messages
 * - Retry logic indicators
 * - Contextual information
 */

export enum ErrorCode {
  // Client errors (4xx)
  INVALID_INPUT = 'INVALID_INPUT',
  EMPTY_PROMPT = 'EMPTY_PROMPT',
  IMAGE_REQUIRED = 'IMAGE_REQUIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',

  // Server errors (5xx)
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
  AI_TEXT_RESPONSE = 'AI_TEXT_RESPONSE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public userMessage: string,
    public statusCode: number = 500,
    public context?: Record<string, any>,
    public isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'AppError'

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      context: this.context,
    }
  }
}

// ============================================================================
// Client Errors (4xx)
// ============================================================================

export class ValidationError extends AppError {
  constructor(field: string, issue: string) {
    super(
      ErrorCode.INVALID_INPUT,
      `Validation failed: ${field} - ${issue}`,
      `Invalid ${field}: ${issue}`,
      400,
      { field, issue },
      false
    )
    this.name = 'ValidationError'
  }
}

export class EmptyPromptError extends AppError {
  constructor() {
    super(
      ErrorCode.EMPTY_PROMPT,
      'Prompt is empty or missing',
      'Please select at least one filter to apply.',
      400,
      undefined,
      false
    )
    this.name = 'EmptyPromptError'
  }
}

export class ImageRequiredError extends AppError {
  constructor() {
    super(
      ErrorCode.IMAGE_REQUIRED,
      'Image required for edit mode',
      'Please take or upload a photo first.',
      400,
      undefined,
      false
    )
    this.name = 'ImageRequiredError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: Date, identifier: string) {
    const seconds = Math.ceil((retryAfter.getTime() - Date.now()) / 1000)
    const minutes = Math.ceil(seconds / 60)
    const timeString = minutes > 1 ? `${minutes} minutes` : `${seconds} seconds`

    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded for ${identifier}`,
      `Too many requests. Please wait ${timeString} before trying again.`,
      429,
      { retryAfter: retryAfter.toISOString(), identifier, seconds },
      true
    )
    this.name = 'RateLimitError'
  }
}

export class UsageLimitError extends AppError {
  constructor(limit: number, resetsAt: Date, remaining: number = 0) {
    const hours = Math.ceil((resetsAt.getTime() - Date.now()) / (1000 * 60 * 60))
    const timeString = hours > 1 ? `${hours} hours` : 'less than an hour'

    super(
      ErrorCode.USAGE_LIMIT_EXCEEDED,
      `Daily usage limit of ${limit} reached`,
      `You've reached your daily limit of ${limit} AI edits. Upgrade to Pro for unlimited edits! Your limit resets in ${timeString}.`,
      403,
      { limit, resetsAt: resetsAt.toISOString(), remaining },
      false
    )
    this.name = 'UsageLimitError'
  }
}

export class AuthenticationRequiredError extends AppError {
  constructor(action: string) {
    super(
      ErrorCode.AUTHENTICATION_REQUIRED,
      `Authentication required for: ${action}`,
      'Please sign in to continue.',
      401,
      { action },
      false
    )
    this.name = 'AuthenticationRequiredError'
  }
}

// ============================================================================
// Server Errors (5xx)
// ============================================================================

export class AIServiceError extends AppError {
  constructor(originalError: Error | string, statusCode: number = 503) {
    const errorMessage = typeof originalError === 'string'
      ? originalError
      : originalError.message

    let userMessage = 'AI service is temporarily unavailable. Please try again in a moment.'

    if (statusCode === 401) {
      userMessage = 'AI service authentication error. Please contact support.'
    } else if (statusCode === 429) {
      userMessage = 'AI service is busy. Please wait a moment and try again.'
    } else if (statusCode >= 500) {
      userMessage = 'AI service is experiencing issues. Please try again later.'
    }

    super(
      ErrorCode.AI_SERVICE_ERROR,
      `AI service error: ${errorMessage}`,
      userMessage,
      statusCode,
      { originalError: errorMessage, statusCode },
      statusCode === 429 || statusCode >= 500
    )
    this.name = 'AIServiceError'
  }
}

export class AIInvalidResponseError extends AppError {
  constructor(details: string, responsePreview?: string) {
    super(
      ErrorCode.AI_INVALID_RESPONSE,
      `AI returned invalid response: ${details}`,
      'The AI returned an invalid response. Please try again with different filters.',
      500,
      { details, responsePreview },
      true
    )
    this.name = 'AIInvalidResponseError'
  }
}

export class AITextResponseError extends AppError {
  constructor(textResponse: string) {
    super(
      ErrorCode.AI_TEXT_RESPONSE,
      'AI returned text instead of image',
      'The AI responded with text instead of generating an image. Try using fewer filters or a clearer photo.',
      500,
      { textResponse: textResponse.substring(0, 200) },
      true
    )
    this.name = 'AITextResponseError'
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, originalError: Error) {
    super(
      ErrorCode.DATABASE_ERROR,
      `Database error during ${operation}: ${originalError.message}`,
      'Database error. Please try again.',
      500,
      { operation, originalError: originalError.message },
      true
    )
    this.name = 'DatabaseError'
  }
}

export class CacheError extends AppError {
  constructor(operation: string, originalError: Error) {
    super(
      ErrorCode.CACHE_ERROR,
      `Cache error during ${operation}: ${originalError.message}`,
      'Cache error. Your request will continue without caching.',
      500,
      { operation, originalError: originalError.message },
      false
    )
    this.name = 'CacheError'
  }
}

export class StorageError extends AppError {
  constructor(operation: string, originalError: Error) {
    super(
      ErrorCode.STORAGE_ERROR,
      `Storage error during ${operation}: ${originalError.message}`,
      'Storage error. Please try again.',
      500,
      { operation, originalError: originalError.message },
      false
    )
    this.name = 'StorageError'
  }
}

export class PaymentError extends AppError {
  constructor(message: string, stripeError?: any) {
    super(
      ErrorCode.PAYMENT_ERROR,
      `Payment error: ${message}`,
      'Payment processing error. Please try again or contact support.',
      500,
      { stripeError: stripeError?.message },
      false
    )
    this.name = 'PaymentError'
  }
}

export class NetworkError extends AppError {
  constructor(url: string, originalError: Error) {
    super(
      ErrorCode.NETWORK_ERROR,
      `Network error accessing ${url}: ${originalError.message}`,
      'Network error. Please check your connection and try again.',
      503,
      { url, originalError: originalError.message },
      true
    )
    this.name = 'NetworkError'
  }
}

/**
 * Parse unknown errors into AppError
 */
export function parseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      'An unexpected error occurred. Please try again.',
      500,
      { originalError: error.message, stack: error.stack },
      false
    )
  }

  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    String(error),
    'An unexpected error occurred. Please try again.',
    500,
    { originalError: String(error) },
    false
  )
}
