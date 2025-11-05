/**
 * Structured logging system for SnapMod
 *
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context
 * - Development vs production formatting
 * - Module-specific loggers
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogContext = Record<string, any>

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  module?: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error, context?: LogContext): void
}

class StructuredLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private module?: string

  constructor(module?: string) {
    this.module = module
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString()
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(this.module && { module: this.module }),
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        },
      }),
    }

    // In development: pretty print for readability
    if (this.isDevelopment) {
      const prefix = `[${timestamp}] [${level.toUpperCase()}]${this.module ? ` [${this.module}]` : ''}`
      const colorCode = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      }[level]
      const resetCode = '\x1b[0m'

      console.log(`${colorCode}${prefix}${resetCode} ${message}`, context || '')
      if (error) {
        console.error(`${colorCode}Error:${resetCode}`, error)
      }
    } else {
      // In production: JSON for log aggregators (Vercel, Sentry, etc.)
      console.log(JSON.stringify(logEntry))
    }
  }

  debug(message: string, context?: LogContext) {
    // Only log debug in development
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error)
  }
}

// Default logger
export const logger = new StructuredLogger()

/**
 * Create a module-specific logger
 *
 * @param module - Module name (e.g., 'API', 'Editor', 'Auth')
 * @returns Logger instance with module prefix
 *
 * @example
 * ```ts
 * const log = createLogger('API')
 * log.info('Request received', { requestId: '123' })
 * // Output: [2024-01-01T12:00:00.000Z] [INFO] [API] Request received { requestId: '123' }
 * ```
 */
export function createLogger(module: string): Logger {
  return new StructuredLogger(module)
}

// Pre-configured loggers for common modules
export const apiLogger = createLogger('API')
export const editorLogger = createLogger('Editor')
export const authLogger = createLogger('Auth')
export const cacheLogger = createLogger('Cache')
export const analyticsLogger = createLogger('Analytics')
export const usageLogger = createLogger('Usage')
export const stripeLogger = createLogger('Stripe')
export const imageLogger = createLogger('Image')
