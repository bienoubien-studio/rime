import { RizomError } from './error.server.js';

class RizomUploadError extends RizomError {
	constructor(message = '', ...args: any) {
		super('Upload ' + message, ...args);
	}
}

export { RizomUploadError };
