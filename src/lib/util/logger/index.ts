import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// Environment and configuration
const LOG_DIR = process.env.RIZOM_LOG_DIR || 'logs';
const LOG_FILE = 'rizom.log';
const LOG_TO_FILE = process.env.RIZOM_LOG_TO_FILE === 'true';

// Log levels with numeric values for comparison
enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5
}

// Get log level from environment variable
const getLogLevelFromEnv = (): LogLevel => {
  const envLevel = (process.env.RIZOM_LOG_LEVEL || 'INFO').toUpperCase();
  return LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
};

// Current log level
let currentLogLevel = getLogLevelFromEnv();

// Format message for logging
const formatMessage = (args: unknown[]): string => {
  return args.map(arg => 
    typeof arg === 'string' ? arg : 
    typeof arg === 'object' ? JSON.stringify(arg) : 
    String(arg)
  ).join(' ');
};

// Write to log file
const writeToFile = async (level: string, args: unknown[]) => {
  if (!LOG_TO_FILE) return;

  try {
    const timestamp = new Date().toISOString();
    const message = formatMessage(args);
    
    // Strip ANSI color codes
    const cleanMessage = message.replace(/\u001b\[\d+m/g, '');
    
    const logEntry = `[${timestamp}] [${level}] ${cleanMessage}\n`;
    
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(path.join(LOG_DIR, LOG_FILE), logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

// Check if a log level is enabled
const isLevelEnabled = (level: LogLevel): boolean => {
  return level >= currentLogLevel;
};

// Base logger implementation
const logger = {
  // Set the log level
  setLevel: (level: keyof typeof LogLevel | LogLevel) => {
    if (typeof level === 'string') {
      currentLogLevel = LogLevel[level] ?? LogLevel.INFO;
    } else {
      currentLogLevel = level;
    }
  },
  
  // Get the current log level
  getLevel: (): string => {
    return LogLevel[currentLogLevel] as string;
  },
  
  // Log methods
  trace: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.TRACE)) {
      console.trace(chalk.magenta('[trace]'), ...args);
      writeToFile('TRACE', args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.DEBUG)) {
      console.debug(chalk.redBright('[debug]'), ...args);
      writeToFile('DEBUG', args);
    }
  },
  info: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.INFO)) {
      console.info(chalk.blue('[info]'), ...args);
      writeToFile('INFO', args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.WARN)) {
      console.warn(chalk.yellow('[warn]'), ...args);
      writeToFile('WARN', args);
    }
  },
  error: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.ERROR)) {
      console.error(chalk.red('[error]'), ...args);
      writeToFile('ERROR', args);
    }
  }
};

// Task logger with colored prefixes
export const taskLogger = {
  info: (...args: unknown[]) => {
      console.info(chalk.yellow('[rizom]'), ...args);
  },
  done: (...args: unknown[]) => {
      console.info(chalk.green('[rizom] ✓'), ...args);
  },
  error: (...args: unknown[]) => {
      console.error(chalk.red('[rizom] ✗'), ...args);
  }
};

// Export the main logger
export { logger };