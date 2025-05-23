import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// Environment and configuration
const LOG_TO_FILE = process.env.RIZOM_LOG_TO_FILE === 'true';
const LOG_DIR = path.join(process.cwd(), 'logs');

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

/**
 * Get the current date formatted as YYYY-MM-DD for log file naming
 */
const getFormattedDate = (date: Date): string => {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

/**
 * Write log entry to a date-prefixed file
 */
const writeToFile = async (level: string, timestamp: string, args: unknown[]) => {
  if (!LOG_TO_FILE) return;

  try {
    const message = formatMessage(args);
    // Strip ANSI color codes
    // eslint-disable-next-line no-control-regex
    const cleanMessage = message.replace(/\u001b\[\d+m/g, '');
    const logEntry = `[${timestamp}] [${level}] ${cleanMessage}\n`;
    
    // Create logs directory if it doesn't exist
    await fs.mkdir(LOG_DIR, { recursive: true });
    
    // Get current date for log file name
    const dateStr = getFormattedDate(new Date());
    const logFileName = `${dateStr}.log`;
    
    // Append to date-specific log file
    await fs.appendFile(path.join(LOG_DIR, logFileName), logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

// Check if a log level is enabled
const isLevelEnabled = (level: LogLevel): boolean => {
  return level >= currentLogLevel;
};

function getFormattedLocalTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

const rizomFormatted = chalk.bold(chalk.gray('[rizom]'))
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
      const timestamp = getFormattedLocalTime(new Date());
      console.trace(...args);
      writeToFile('TRACE', timestamp, args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.DEBUG)) {
      const timestamp = getFormattedLocalTime(new Date());
      console.debug(chalk.redBright('DEBUG'), ...args);
      writeToFile('DEBUG', timestamp, args);
    }
  },
  info: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.INFO)) {
      const timestamp = getFormattedLocalTime(new Date());
      console.info( chalk.dim(timestamp), rizomFormatted, chalk.blue(' INFO'), ...args);
      writeToFile('INFO', timestamp, args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.WARN)) {
      const timestamp = getFormattedLocalTime(new Date());
      console.warn( chalk.dim(timestamp),rizomFormatted, chalk.yellow(' WARN'), ...args);
      writeToFile('WARN', timestamp, args);
    }
  },
  error: (...args: unknown[]) => {
    if (isLevelEnabled(LogLevel.ERROR)) {
      const timestamp = getFormattedLocalTime(new Date());
      console.error( chalk.dim(timestamp), rizomFormatted, chalk.red('ERROR'), ...args);
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