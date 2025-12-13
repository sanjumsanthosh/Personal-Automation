/**
 * Logging utility for consistent logging across the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
    [key: string]: unknown
}

class Logger {
    private formatTimestamp(): string {
        return new Date().toISOString()
    }

    private formatMessage(level: LogLevel, context: string, message: string, data?: LogContext): string {
        const timestamp = this.formatTimestamp()
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`

        if (data && Object.keys(data).length > 0) {
            return `${prefix} ${message} | ${JSON.stringify(data)}`
        }

        return `${prefix} ${message}`
    }

    info(context: string, message: string, data?: LogContext): void {
        console.log(this.formatMessage('info', context, message, data))
    }

    warn(context: string, message: string, data?: LogContext): void {
        console.warn(this.formatMessage('warn', context, message, data))
    }

    error(context: string, message: string, error?: unknown, data?: LogContext): void {
        const errorData = {
            ...data,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : error
        }
        console.error(this.formatMessage('error', context, message, errorData))
    }

    debug(context: string, message: string, data?: LogContext): void {
        console.debug(this.formatMessage('debug', context, message, data))
    }

    // API-specific helpers
    apiRequest(method: string, path: string, body?: unknown): void {
        this.info('API', `${method} ${path}`, body ? { body } : undefined)
    }

    apiResponse(method: string, path: string, status: number, data?: unknown): void {
        const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info'
        this[level]('API', `${method} ${path} -> ${status}`, data ? { response: data } : undefined)
    }

    apiError(method: string, path: string, error: unknown): void {
        this.error('API', `${method} ${path} failed`, error)
    }
}

export const logger = new Logger()
