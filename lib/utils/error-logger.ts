/**
 * Error Logging Utility
 * Structured error logging dengan context
 */

interface ErrorContext {
  userId?: string
  userRole?: string
  action?: string
  component?: string
  metadata?: Record<string, any>
}

interface LogEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  error?: Error
  context?: ErrorContext
  stack?: string
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  /**
   * Log error dengan context
   */
  error(message: string, error?: Error, context?: ErrorContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error,
      context,
      stack: error?.stack
    }
    
    if (this.isDevelopment) {
      console.error('🔴 Error:', message)
      if (error) {
        console.error('Error details:', error)
      }
      if (context) {
        console.error('Context:', context)
      }
      if (error?.stack) {
        console.error('Stack trace:', error.stack)
      }
    } else {
      // Production: log tanpa stack trace
      console.error('Error:', {
        message,
        timestamp: entry.timestamp,
        context
      })
      
      // TODO: Send to external logging service (Sentry, LogRocket, etc)
      // this.sendToExternalService(entry)
    }
  }
  
  /**
   * Log warning
   */
  warn(message: string, context?: ErrorContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context
    }
    
    if (this.isDevelopment) {
      console.warn('⚠️ Warning:', message)
      if (context) {
        console.warn('Context:', context)
      }
    } else {
      console.warn('Warning:', {
        message,
        timestamp: entry.timestamp
      })
    }
  }
  
  /**
   * Log info (development only)
   */
  info(message: string, context?: ErrorContext) {
    if (this.isDevelopment) {
      console.info('ℹ️ Info:', message)
      if (context) {
        console.info('Context:', context)
      }
    }
  }
  
  /**
   * Log API error
   */
  apiError(endpoint: string, error: Error, context?: ErrorContext) {
    this.error(`API Error: ${endpoint}`, error, {
      ...context,
      action: 'api_call',
      metadata: {
        endpoint
      }
    })
  }
  
  /**
   * Log database error
   */
  dbError(operation: string, error: Error, context?: ErrorContext) {
    this.error(`Database Error: ${operation}`, error, {
      ...context,
      action: 'database_operation',
      metadata: {
        operation
      }
    })
  }
  
  /**
   * Log auth error
   */
  authError(action: string, error: Error, context?: ErrorContext) {
    this.error(`Auth Error: ${action}`, error, {
      ...context,
      action: 'authentication',
      metadata: {
        authAction: action
      }
    })
  }
  
  /**
   * Log component error (dari Error Boundary)
   */
  componentError(componentName: string, error: Error, errorInfo?: any) {
    this.error(`Component Error: ${componentName}`, error, {
      component: componentName,
      action: 'component_render',
      metadata: {
        errorInfo
      }
    })
  }
  
  /**
   * Send to external logging service (placeholder)
   */
  private sendToExternalService(entry: LogEntry) {
    // TODO: Implement external logging service integration
    // Examples:
    // - Sentry: Sentry.captureException(entry.error, { contexts: entry.context })
    // - LogRocket: LogRocket.captureException(entry.error)
    // - Custom API: fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
  }
}

// Export singleton instance
export const logger = new ErrorLogger()

// Export convenience functions
export const logError = (message: string, error?: Error, context?: ErrorContext) => 
  logger.error(message, error, context)

export const logWarn = (message: string, context?: ErrorContext) => 
  logger.warn(message, context)

export const logInfo = (message: string, context?: ErrorContext) => 
  logger.info(message, context)

export const logApiError = (endpoint: string, error: Error, context?: ErrorContext) => 
  logger.apiError(endpoint, error, context)

export const logDbError = (operation: string, error: Error, context?: ErrorContext) => 
  logger.dbError(operation, error, context)

export const logAuthError = (action: string, error: Error, context?: ErrorContext) => 
  logger.authError(action, error, context)

export const logComponentError = (componentName: string, error: Error, errorInfo?: any) => 
  logger.componentError(componentName, error, errorInfo)
