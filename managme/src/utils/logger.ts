export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  component?: string;
  userId?: string;
  action?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isDevelopment: boolean = import.meta.env.DEV;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const component = entry.component ? `[${entry.component}]` : '';
    const action = entry.action ? `{${entry.action}}` : '';
    
    return `${timestamp} ${entry.level} ${component}${action} ${entry.message}`;
  }

  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Utrzymuj maksymalną liczbę logów
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Wyświetl w konsoli tylko w trybie development
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, entry.metadata);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, entry.metadata);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, entry.metadata);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, entry.error || entry.metadata);
          if (entry.error?.stack) {
            console.error(entry.error.stack);
          }
          break;
      }
    }
  }

  public debug(message: string, component?: string, metadata?: Record<string, any>): void {
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      component,
      metadata
    });
  }

  public info(message: string, component?: string, action?: string, metadata?: Record<string, any>): void {
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      component,
      action,
      metadata
    });
  }

  public warn(message: string, component?: string, action?: string, metadata?: Record<string, any>): void {
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      component,
      action,
      metadata
    });
  }

  public error(
    message: string, 
    error?: Error, 
    component?: string, 
    action?: string,
    metadata?: Record<string, any>
  ): void {
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      component,
      action,
      error,
      metadata
    });
  }

  // API Service specific methods
  public logApiRequest(method: string, url: string, data?: any): void {
    this.info(`API Request: ${method} ${url}`, 'ApiService', 'request', { 
      method, 
      url,
      hasData: !!data 
    });
  }

  public logApiResponse(method: string, url: string, status: number, data?: any): void {
    this.info(`API Response: ${method} ${url} - ${status}`, 'ApiService', 'response', { 
      method, 
      url, 
      status,
      hasData: !!data 
    });
  }

  public logApiError(method: string, url: string, error: Error): void {
    this.error(`API Error: ${method} ${url}`, error, 'ApiService', 'error', { 
      method, 
      url 
    });
  }

  // Task Service specific methods
  public logTaskAction(action: string, taskId?: string, details?: Record<string, any>): void {
    this.info(`Task ${action}`, 'TaskService', action, { 
      taskId, 
      ...details 
    });
  }

  public logTaskError(action: string, error: Error, taskId?: string): void {
    this.error(`Task ${action} failed`, error, 'TaskService', action, { 
      taskId 
    });
  }

  // User authentication methods
  public logAuthAction(action: string, userId?: string, details?: Record<string, any>): void {
    this.info(`Auth ${action}`, 'AuthService', action, { 
      userId, 
      ...details 
    });
  }

  public logAuthError(action: string, error: Error, details?: Record<string, any>): void {
    this.error(`Auth ${action} failed`, error, 'AuthService', action, details);
  }

  // Component lifecycle methods
  public logComponentMount(componentName: string, props?: Record<string, any>): void {
    this.debug(`Component mounted: ${componentName}`, componentName, props);
  }

  public logComponentUnmount(componentName: string): void {
    this.debug(`Component unmounted: ${componentName}`, componentName);
  }

  public logComponentError(componentName: string, error: Error, errorInfo?: any): void {
    this.error(`Component error in ${componentName}`, error, componentName, 'error', errorInfo);
  }

  // Utility methods
  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = level 
      ? this.logs.filter(log => log.level === level)
      : this.logs;
    
    return limit 
      ? filteredLogs.slice(-limit)
      : filteredLogs;
  }

  public getErrorLogs(limit: number = 50): LogEntry[] {
    return this.getLogs(LogLevel.ERROR, limit);
  }

  public clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', 'Logger', 'clear');
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Performance logging
  public startTimer(label: string, component?: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      this.info(`Timer ${label}: ${duration}ms`, component, 'performance', { 
        duration, 
        label 
      });
    };
  }

  // MongoDB connection logging
  public logDatabaseAction(action: string, collection?: string, details?: Record<string, any>): void {
    this.info(`Database ${action}`, 'Database', action, { 
      collection, 
      ...details 
    });
  }

  public logDatabaseError(action: string, error: Error, collection?: string): void {
    this.error(`Database ${action} failed`, error, 'Database', action, { 
      collection 
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Error boundary helper
export const logErrorBoundary = (error: Error, errorInfo: any, componentName: string) => {
  logger.logComponentError(componentName, error, errorInfo);
};
