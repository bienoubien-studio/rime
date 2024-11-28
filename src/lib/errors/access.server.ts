import { RizomError } from './error.server.js';

class RizomAccessError extends RizomError {
	constructor(message = '', ...args: any) {
		super('Unauthorized ' + message, ...args);
	}
}

export { RizomAccessError };
