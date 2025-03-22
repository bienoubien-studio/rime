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
const writeToFile = async (level: string, timestamp: string, args: unknown[]) => {
  if (!LOG_TO_FILE) return;

  try {
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
      const timestamp = new Date().toISOString();
      console.trace(...args);
      writeToFile('TRACE', timestamp, args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.DEBUG)) {
      const timestamp = new Date().toISOString();
      console.debug(chalk.redBright('DEBUG'), ...args);
      writeToFile('DEBUG', timestamp, args);
    }
  },
  info: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.INFO)) {
      const timestamp = new Date().toISOString();
      console.info(timestamp, chalk.blue(' INFO'),'[Rizom]', ...args);
      writeToFile('INFO', timestamp, args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.WARN)) {
      const timestamp = new Date().toISOString();
      console.warn(timestamp,chalk.yellow(' WARN'),'[Rizom]', ...args);
      writeToFile('WARN', timestamp, args);
    }
  },
  error: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.ERROR)) {
      const timestamp = new Date().toISOString();
      console.error(timestamp, chalk.red('ERROR'),'[Rizom]', ...args);
      writeToFile('ERROR', timestamp, args);
    }
  }
};

// Task logger for generator
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

export { logger };