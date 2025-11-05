/**
 * API response utilities for consistent response formatting
 *
 * Provides standardized response formats for:
 * - Success responses
 * - Error responses
 * - Consistent status codes
 */

import { AppError, ErrorCode } from './errors'
import { apiLogger } from './logger'

export interface ApiErrorResponse {
  error: {
    code: ErrorCode
    message: string
    userMessage: string
    isRetryable: boolean
    context?: Record<string, any>
  }
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  cached?: boolean
}

/**
 * Create a standardized error response
 *
 * @param error - AppError instance
 * @param requestId - Optional request ID for tracking
 * @returns Response object with error details
 *
 * @example
 * ```ts
 * if (!rateLimit.allowed) {
 *   throw new RateLimitError(rateLimit.resetAt, identifier)
 * }
 * // In catch block:
 * return errorResponse(error, requestId)
 * ```
 */
export function errorResponse(error: AppError, requestId?: string): Response {
  const body: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      isRetryable: error.isRetryable,
      context: {
        ...error.context,
        ...(requestId && { requestId }),
      },
    },
  }

  // Log error with context
  apiLogger.error(
    error.message,
    error,
    {
      code: error.code,
      statusCode: error.statusCode,
      isRetryable: error.isRetryable,
      ...(requestId && { requestId }),
      ...error.context,
    }
  )

  // Add retry headers for retryable errors
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (error.isRetryable && error.context?.retryAfter) {
    const retryAfterDate = new Date(error.context.retryAfter)
    headers['Retry-After'] = String(Math.ceil((retryAfterDate.getTime() - Date.now()) / 1000))
  }

  return Response.json(body, {
    status: error.statusCode,
    headers,
  })
}

/**
 * Create a standardized success response
 *
 * @param data - Response data
 * @param options - Optional metadata (cached, requestId, etc.)
 * @returns Response object with data
 *
 * @example
 * ```ts
 * return successResponse({ image: imageDataUrl }, { cached: true })
 * ```
 */
export function successResponse<T = any>(
  data: T,
  options?: {
    cached?: boolean
    requestId?: string
  }
): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.cached && { cached: true }),
  }

  // Log success if requestId provided
  if (options?.requestId) {
    apiLogger.info('Request successful', {
      requestId: options.requestId,
      cached: options.cached || false,
    })
  }

  return Response.json(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Parse client-side API error from fetch response
 *
 * @param response - Fetch response object
 * @returns Parsed error with user message
 *
 * @example
 * ```ts
 * const response = await fetch('/api/nano-banana', { ... })
 * if (!response.ok) {
 *   const error = await parseApiError(response)
 *   throw error
 * }
 * ```
 */
export async function parseApiError(response: Response): Promise<AppError> {
  try {
    const body = await response.json() as ApiErrorResponse

    if (body.error) {
      return new AppError(
        body.error.code,
        body.error.message,
        body.error.userMessage,
        response.status,
        body.error.context,
        body.error.isRetryable
      )
    }

    // Fallback if response doesn't match expected format
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      `HTTP ${response.status}: ${response.statusText}`,
      'An unexpected error occurred. Please try again.',
      response.status
    )
  } catch (parseError) {
    // If JSON parsing fails, return generic error
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      `HTTP ${response.status}: ${response.statusText}`,
      'Failed to process server response. Please try again.',
      response.status
    )
  }
}

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse<T>(
  response: any
): response is ApiSuccessResponse<T> {
  return response?.success === true && 'data' in response
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(response: any): response is ApiErrorResponse {
  return 'error' in response && typeof response.error === 'object'
}
