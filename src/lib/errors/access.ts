import { RizomError } from './error.server';

class RizomAccessError extends RizomError {
	constructor(message = '', ...args: any) {
		super('Unauthorized ' + message, ...args);
	}
}

export { RizomAccessError };
