import logger, { type LogLevelDesc } from 'loglevel';
import prefixer from 'loglevel-plugin-prefix';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

const browser = typeof window === 'undefined' ? false : true;
const envLevel = browser ? 'TRACE' : process.env.RIZOM_LOG_LEVEL || 'TRACE';
const LOG_TO_FILE = process.env.RIZOM_LOG_TO_FILE === 'true';
const LOG_DIR = process.env.RIZOM_LOG_DIR || 'logs';
const LOG_FILE = 'rizom.log';

// File logging function
const writeToLog = async (level: string, message: unknown, category?: string) => {
	if (!LOG_TO_FILE || browser) return;

	try {
		const timestamp = new Date().toISOString();
		const categoryPrefix = category ? `[${category}] ` : '';
		const logEntry = `[${timestamp}] ${categoryPrefix}[${level}] ${
			typeof message === 'string' ? message : JSON.stringify(message)
		}\n`;

		await fs.mkdir(LOG_DIR, { recursive: true });
		await fs.appendFile(path.join(LOG_DIR, LOG_FILE), logEntry);
	} catch (error) {
		console.error('Failed to write to log file:', error);
	}
};

// Create a proxy factory for loggers
const createLoggerProxy = (originalLogger: any, category?: string) => {
	return new Proxy(originalLogger, {
		get(target, property) {
			const original = target[property];
			if (
				typeof original === 'function' &&
				['trace', 'debug', 'info', 'warn', 'error'].includes(property as string)
			) {
				return function (...args: unknown[]) {
					original.apply(target, args);
					writeToLog(property.toString().toUpperCase(), args[0], category);
				};
			}
			return original;
		}
	});
};

// Create proxied loggers
const originalLogger = logger.getLogger('main');
const originalRequestLogger = logger.getLogger('req');

const loggerProxy = createLoggerProxy(originalLogger);
const requestLoggerProxy = createLoggerProxy(originalRequestLogger, 'REQUEST');

prefixer.reg(logger);
prefixer.apply(logger, {
	format(level) {
		if (level === 'WARN') {
			return `${chalk.yellow(`[warn]`)}`;
		}
		if (level === 'ERROR') {
			return `${chalk.red(`[error]`)}`;
		}
		if (level === 'INFO ') {
			return `${chalk.yellow(`[info]`)}`;
		}
		return level;
	}
});

logger.setLevel(envLevel as LogLevelDesc);

prefixer.apply(logger.getLogger('taskDone'), {
	format() {
		return `${chalk.green(`[rizom] ✓ `)}`;
	}
});

prefixer.apply(logger.getLogger('taskError'), {
	format() {
		return `${chalk.red(`[rizom] ✗ `)}`;
	}
});

prefixer.apply(logger.getLogger('taskInfo'), {
	format() {
		return `${chalk.yellow(`[rizom]`)}`;
	}
});

prefixer.apply(logger.getLogger('req'), {
	format() {
		return `${chalk.yellow(`[request]`)}`;
	}
});

export const taskLogger = {
	info: logger.getLogger('taskInfo').info,
	done: logger.getLogger('taskDone').info,
	error: logger.getLogger('taskError').info
};

export const requestLogger = requestLoggerProxy;

export const debug = loggerProxy.debug.bind(loggerProxy);

export default loggerProxy;
