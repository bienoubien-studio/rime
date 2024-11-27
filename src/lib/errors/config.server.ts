import { RizomError } from './error.server.js';

class RizomConfigError extends RizomError {
	constructor(message = '', ...args: any) {
		super('Config ' + message, ...args);
	}
}

export { RizomConfigError };
