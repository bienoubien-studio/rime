import { RizomError } from './error.server';

class RizomHookError extends RizomError {
	constructor(message = '', ...args: any) {
		super('Error in collection hooks ' + message, ...args);
	}
}

export { RizomHookError };
