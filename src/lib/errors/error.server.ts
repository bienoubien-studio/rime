class RizomError extends Error {
	constructor(message = '', ...args: any) {
		super(message, ...args);
		this.message = message;
	}
}

export { RizomError };
