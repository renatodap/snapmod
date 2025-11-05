/**
 * Request tracing utilities
 *
 * Provides request ID generation and tracing for API calls
 */

import { apiLogger } from './logger'
import { AppError, parseError } from './errors'
import { errorResponse } from './api-response'

/**
 * Generate a unique request ID for tracking
 *
 * Format: req_<timestamp>_<random>
 *
 * @returns Unique request ID
 *
 * @example
 * ```ts
 * const requestId = generateRequestId()
 * // Returns: "req_1704067200000_a1b2c3"
 * ```
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Higher-order function to wrap API route handlers with request tracing
 *
 * Automatically:
 * - Generates request ID
 * - Logs request start/end
 * - Handles errors consistently
 * - Returns formatted responses
 *
 * @param handler - API route handler function
 * @returns Wrapped handler with tracing
 *
 * @example
 * ```ts
 * export const POST = withRequestTracing(async (req: Request, requestId: string) => {
 *   const body = await req.json()
 *   // ... your logic
 *   return successResponse(result)
 * })
 * ```
 */
export function withRequestTracing<T>(
  handler: (req: Request, requestId: string) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    try {
      // Log request start
      apiLogger.info('Request started', {
        requestId,
        method: req.method,
        url: req.url,
      })

      // Execute handler
      const response = await handler(req, requestId)

      // Log request completion
      const duration = Date.now() - startTime
      apiLogger.info('Request completed', {
        requestId,
        status: response.status,
        duration,
      })

      return response
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime
      const appError = error instanceof AppError ? error : parseError(error)

      apiLogger.error('Request failed', appError, {
        requestId,
        duration,
        code: appError.code,
      })

      // Return formatted error response
      return errorResponse(appError, requestId)
    }
  }
}

/**
 * Create a scoped logger with request ID
 *
 * @param requestId - Request ID for context
 * @returns Logger with request ID in context
 *
 * @example
 * ```ts
 * const log = createRequestLogger(requestId)
 * log.info('Processing image', { size: imageSize })
 * // Output: [INFO] [API] Processing image { requestId: 'req_...', size: 1024 }
 * ```
 */
export function createRequestLogger(requestId: string) {
  return {
    debug: (message: string, context?: Record<string, any>) =>
      apiLogger.debug(message, { requestId, ...context }),
    info: (message: string, context?: Record<string, any>) =>
      apiLogger.info(message, { requestId, ...context }),
    warn: (message: string, context?: Record<string, any>) =>
      apiLogger.warn(message, { requestId, ...context }),
    error: (message: string, error?: Error, context?: Record<string, any>) =>
      apiLogger.error(message, error, { requestId, ...context }),
  }
}

/**
 * Measure execution time of async operations
 *
 * @param operation - Operation name
 * @param fn - Async function to measure
 * @returns Result and duration
 *
 * @example
 * ```ts
 * const { result, duration } = await measureAsync('AI generation', async () => {
 *   return await callOpenRouter()
 * })
 * log.info('AI generation completed', { duration })
 * ```
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    apiLogger.debug(`${operation} completed`, { duration })

    return { result, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    apiLogger.error(`${operation} failed`, error as Error, { duration })
    throw error
  }
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - Operation name
 * @param fn - Async function to retry
 * @param maxRetries - Maximum retry attempts
 * @param baseDelay - Base delay in ms (doubles each retry)
 * @returns Operation result
 *
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   'AI API call',
 *   async () => await fetch('...'),
 *   3,
 *   2000
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  operation: string,
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      apiLogger.debug(`${operation} attempt ${attempt}/${maxRetries}`)
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        apiLogger.warn(`${operation} failed, retrying in ${delay}ms`, {
          attempt,
          maxRetries,
          error: lastError.message,
        })
        await sleep(delay)
      }
    }
  }

  apiLogger.error(`${operation} failed after ${maxRetries} attempts`, lastError)
  throw lastError
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
