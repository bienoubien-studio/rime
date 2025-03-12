import logger, { type LogLevelDesc } from 'loglevel';
import prefixer from 'loglevel-plugin-prefix';
import chalk from 'chalk';

const browser = typeof window === 'undefined' ? false : true;
const envLevel = browser ? 'TRACE' : process.env.RIZOM_LOG_LEVEL || 'TRACE';

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

export const requestLogger = logger.getLogger('req');

export const debug = (value: unknown) => {
	logger.debug(value);
};

export default logger;
