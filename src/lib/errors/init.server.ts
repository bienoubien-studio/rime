import { RizomError } from './error.server.js';

class RizomInitError extends RizomError {
	constructor(message = '', ...args: any) {
		super(message, ...args);
	}
}

export { RizomInitError };
