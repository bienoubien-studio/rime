import { RizomError } from './error.server.js';

class RizomLoginError extends RizomError {
	constructor(message = '', ...args: any) {
		super(message, ...args);
	}
}

class RizomLoginEmailError extends RizomLoginError {
	constructor(message = '', ...args: any) {
		super(message, ...args);
	}
}

class RizomLoginPasswordError extends RizomLoginError {
	constructor(message = '', ...args: any) {
		super(message, ...args);
	}
}

class RizomLoginLockedError extends RizomLoginError {
	constructor(message = '', ...args: any) {
		super('Max login attempts reached, user locked. ' + message, ...args);
	}
}

export { RizomLoginError, RizomLoginEmailError, RizomLoginPasswordError, RizomLoginLockedError };
