import { RizomError } from './error.server';

class RizomNotFoundError extends RizomError {
	constructor(message = '', ...args: any) {
		super('Not Found ' + message, ...args);
	}
}

export { RizomNotFoundError };
