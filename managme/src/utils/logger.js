export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static instance;
    logs = [];
    maxLogs = 1000;
    isDevelopment = import.meta.env.DEV;
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    formatMessage(entry) {
        const timestamp = entry.timestamp.toISOString();
        const component = entry.component ? `[${entry.component}]` : '';
        const action = entry.action ? `{${entry.action}}` : '';
        return `${timestamp} ${entry.level} ${component}${action} ${entry.message}`;
    }
    addLogEntry(entry) {
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
    debug(message, component, metadata) {
        this.addLogEntry({
            timestamp: new Date(),
            level: LogLevel.DEBUG,
            message,
            component,
            metadata
        });
    }
    info(message, component, action, metadata) {
        this.addLogEntry({
            timestamp: new Date(),
            level: LogLevel.INFO,
            message,
            component,
            action,
            metadata
        });
    }
    warn(message, component, action, metadata) {
        this.addLogEntry({
            timestamp: new Date(),
            level: LogLevel.WARN,
            message,
            component,
            action,
            metadata
        });
    }
    error(message, error, component, action, metadata) {
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
    logApiRequest(method, url, data) {
        this.info(`API Request: ${method} ${url}`, 'ApiService', 'request', {
            method,
            url,
            hasData: !!data
        });
    }
    logApiResponse(method, url, status, data) {
        this.info(`API Response: ${method} ${url} - ${status}`, 'ApiService', 'response', {
            method,
            url,
            status,
            hasData: !!data
        });
    }
    logApiError(method, url, error) {
        this.error(`API Error: ${method} ${url}`, error, 'ApiService', 'error', {
            method,
            url
        });
    }
    // Task Service specific methods
    logTaskAction(action, taskId, details) {
        this.info(`Task ${action}`, 'TaskService', action, {
            taskId,
            ...details
        });
    }
    logTaskError(action, error, taskId) {
        this.error(`Task ${action} failed`, error, 'TaskService', action, {
            taskId
        });
    }
    // User authentication methods
    logAuthAction(action, userId, details) {
        this.info(`Auth ${action}`, 'AuthService', action, {
            userId,
            ...details
        });
    }
    logAuthError(action, error, details) {
        this.error(`Auth ${action} failed`, error, 'AuthService', action, details);
    }
    // Component lifecycle methods
    logComponentMount(componentName, props) {
        this.debug(`Component mounted: ${componentName}`, componentName, props);
    }
    logComponentUnmount(componentName) {
        this.debug(`Component unmounted: ${componentName}`, componentName);
    }
    logComponentError(componentName, error, errorInfo) {
        this.error(`Component error in ${componentName}`, error, componentName, 'error', errorInfo);
    }
    // Utility methods
    getLogs(level, limit) {
        let filteredLogs = level
            ? this.logs.filter(log => log.level === level)
            : this.logs;
        return limit
            ? filteredLogs.slice(-limit)
            : filteredLogs;
    }
    getErrorLogs(limit = 50) {
        return this.getLogs(LogLevel.ERROR, limit);
    }
    clearLogs() {
        this.logs = [];
        this.info('Logs cleared', 'Logger', 'clear');
    }
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
    // Performance logging
    startTimer(label, component) {
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
    logDatabaseAction(action, collection, details) {
        this.info(`Database ${action}`, 'Database', action, {
            collection,
            ...details
        });
    }
    logDatabaseError(action, error, collection) {
        this.error(`Database ${action} failed`, error, 'Database', action, {
            collection
        });
    }
}
// Export singleton instance
export const logger = Logger.getInstance();
// Error boundary helper
export const logErrorBoundary = (error, errorInfo, componentName) => {
    logger.logComponentError(componentName, error, errorInfo);
};
