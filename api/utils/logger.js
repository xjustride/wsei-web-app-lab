const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Log levels
const LOG_LEVELS = {
  ERROR: { level: 0, color: colors.red, label: 'ERROR' },
  WARN: { level: 1, color: colors.yellow, label: 'WARN' },
  INFO: { level: 2, color: colors.blue, label: 'INFO' },
  HTTP: { level: 3, color: colors.green, label: 'HTTP' },
  DEBUG: { level: 4, color: colors.magenta, label: 'DEBUG' }
};

class Logger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'INFO';
    this.enableFileLogging = options.enableFileLogging || false;
    this.logDirectory = options.logDirectory || path.join(__dirname, '../logs');
    this.maxLogFiles = options.maxLogFiles || 7;
    
    if (this.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  getCurrentLogLevel() {
    return LOG_LEVELS[this.logLevel]?.level || LOG_LEVELS.INFO.level;
  }

  shouldLog(level) {
    return LOG_LEVELS[level].level <= this.getCurrentLogLevel();
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    const levelInfo = LOG_LEVELS[level];
    
    // Terminal output with colors
    const coloredLevel = `${levelInfo.color}${levelInfo.label}${colors.reset}`;
    const coloredTimestamp = `${colors.gray}${timestamp}${colors.reset}`;
    
    let formattedMessage = `[${coloredTimestamp}] ${coloredLevel}: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      formattedMessage += `\n${colors.dim}${JSON.stringify(meta, null, 2)}${colors.reset}`;
    }
    
    return formattedMessage;
  }

  formatFileMessage(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    const levelInfo = LOG_LEVELS[level];
    
    let logEntry = {
      timestamp,
      level: levelInfo.label,
      message,
      ...meta
    };
    
    return JSON.stringify(logEntry);
  }

  writeToFile(level, message, meta = {}) {
    if (!this.enableFileLogging) return;
    
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDirectory, `managme-${today}.log`);
    const logEntry = this.formatFileMessage(level, message, meta);
    
    fs.appendFileSync(logFile, logEntry + '\n');
    
    // Clean up old log files
    this.cleanupOldLogs();
  }

  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logDirectory);
      const logFiles = files
        .filter(file => file.startsWith('managme-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDirectory, file),
          stat: fs.statSync(path.join(this.logDirectory, file))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime);

      if (logFiles.length > this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`${colors.gray}Deleted old log file: ${file.name}${colors.reset}`);
        });
      }
    } catch (error) {
      console.error('Error cleaning up log files:', error);
    }
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, message, meta);
    console.log(formattedMessage);
    
    this.writeToFile(level, message, meta);
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  http(message, meta = {}) {
    this.log('HTTP', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Special method for HTTP requests
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id || 'anonymous'
    };

    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`;
    
    if (res.statusCode >= 400) {
      this.error(message, meta);
    } else {
      this.http(message, meta);
    }
  }

  // Special method for database operations
  logDatabase(operation, collection, success, meta = {}) {
    const message = `Database ${operation} on ${collection} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const logMeta = {
      operation,
      collection,
      success,
      ...meta
    };

    if (success) {
      this.debug(message, logMeta);
    } else {
      this.error(message, logMeta);
    }
  }

  // Special method for authentication events
  logAuth(event, username, success, meta = {}) {
    const message = `Auth ${event} for user '${username}' - ${success ? 'SUCCESS' : 'FAILED'}`;
    const logMeta = {
      event,
      username,
      success,
      ...meta
    };

    if (success) {
      this.info(message, logMeta);
    } else {
      this.warn(message, logMeta);
    }
  }
}

// Create and export a default logger instance
const logger = new Logger({
  logLevel: process.env.LOG_LEVEL || 'INFO',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  logDirectory: process.env.LOG_DIRECTORY || path.join(__dirname, '../logs'),
  maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 7
});

module.exports = logger;
