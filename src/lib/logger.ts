/**
 * Structured logging utility for production and development
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment: boolean;
  private isServer: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isServer = typeof window === 'undefined';
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Simple format for development
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error ? `\n  Error: ${entry.error.message}\n  Stack: ${entry.error.stack}` : '';
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`;
    } else {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        environment: process.env.NODE_ENV,
        runtime: this.isServer ? 'server' : 'client',
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatLog(entry);

    // Output to appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // API request logging helper
  logApiRequest(method: string, path: string, statusCode: number, duration: number, context?: Record<string, unknown>): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API ${method} ${path}`, {
      ...context,
      statusCode,
      duration,
      method,
      path,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const { debug, info, warn, error } = logger;
