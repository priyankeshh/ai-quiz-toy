// Comprehensive logging utility for debugging and monitoring
export class Logger {
  private static instance: Logger;
  private logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: string;
    message: string;
    data?: any;
  }> = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', category: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    this.logs.push(logEntry);
    
    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Console output with styling
    const style = this.getConsoleStyle(level);
    console.log(
      `%c[${level.toUpperCase()}] ${category}: ${message}`,
      style,
      data || ''
    );

    // Send critical errors to monitoring (in production)
    if (level === 'error' && process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(logEntry);
    }
  }

  private getConsoleStyle(level: string): string {
    switch (level) {
      case 'error': return 'color: #ff4444; font-weight: bold;';
      case 'warn': return 'color: #ffaa00; font-weight: bold;';
      case 'info': return 'color: #4444ff;';
      case 'debug': return 'color: #888888;';
      default: return '';
    }
  }

  private sendToMonitoring(logEntry: any) {
    // In a real app, this would send to a monitoring service
    // For now, we'll just store it locally
    try {
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push(logEntry);
      localStorage.setItem('app_errors', JSON.stringify(existingErrors.slice(-10))); // Keep last 10 errors
    } catch (e) {
      console.error('Failed to store error log:', e);
    }
  }

  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log('error', category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    this.log('debug', category, message, data);
  }

  // API-specific logging
  apiRequest(endpoint: string, method: string, data?: any) {
    this.info('API', `${method} ${endpoint}`, data);
  }

  apiResponse(endpoint: string, status: number, data?: any) {
    if (status >= 400) {
      this.error('API', `${endpoint} failed with status ${status}`, data);
    } else {
      this.info('API', `${endpoint} succeeded with status ${status}`, data);
    }
  }

  apiError(endpoint: string, error: any) {
    this.error('API', `${endpoint} error`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }

  // Voice-specific logging
  voiceEvent(event: string, data?: any) {
    this.debug('VOICE', event, data);
  }

  voiceError(error: string, data?: any) {
    this.error('VOICE', error, data);
  }

  // User interaction logging
  userAction(action: string, data?: any) {
    this.info('USER', action, data);
  }

  // Performance logging
  performance(metric: string, value: number, unit: string = 'ms') {
    this.debug('PERFORMANCE', `${metric}: ${value}${unit}`);
  }

  // Get all logs for debugging
  getAllLogs() {
    return [...this.logs];
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info('SYSTEM', 'Logs cleared');
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const logger = Logger.getInstance();

// Browser compatibility checks
export const BrowserCompatibility = {
  checkSpeechSynthesis(): boolean {
    const isSupported = 'speechSynthesis' in window;
    logger.info('COMPAT', 'Speech synthesis support', { supported: isSupported });
    return isSupported;
  },

  checkSpeechRecognition(): boolean {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    logger.info('COMPAT', 'Speech recognition support', { supported: isSupported });
    return isSupported;
  },

  checkLocalStorage(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      logger.info('COMPAT', 'LocalStorage support', { supported: true });
      return true;
    } catch (e) {
      logger.error('COMPAT', 'LocalStorage not supported', e);
      return false;
    }
  },

  checkTouchSupport(): boolean {
    const isSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    logger.info('COMPAT', 'Touch support', { supported: isSupported });
    return isSupported;
  },

  runAllChecks(): Record<string, boolean> {
    return {
      speechSynthesis: this.checkSpeechSynthesis(),
      speechRecognition: this.checkSpeechRecognition(),
      localStorage: this.checkLocalStorage(),
      touchSupport: this.checkTouchSupport()
    };
  }
};
