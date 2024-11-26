import { RizomError } from './error.server';

class RizomConfigError extends RizomError {
	constructor(message = '', ...args: any) {
		super('Config ' + message, ...args);
	}
}

export { RizomConfigError };
