import type { Prototype } from '$lib/core/types/doc.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { HookBeforeOperation } from '$lib/core/config/types/hooks.js';
import { logger } from '$lib/core/logger/index.server.js';

export const authorize: HookBeforeOperation<Prototype> = async (args) => {
	const { config, event, operation, context } = args;
	let authorized = false;

	const params = {
		event,
		id: context.params.id
	};
	
	if(args.context.isSystemOperation) return args
	
	switch (operation) {
		case 'create':
			authorized = config.access.create(event.locals.user, params);
			break;
		case 'read':
			authorized = config.access.read(event.locals.user, params);
			break;
		case 'update':
			authorized = config.access.update(event.locals.user, params);
			break;
		case 'delete':
			authorized = config.access.delete(event.locals.user, params);
			break;
	}
	
	if (!authorized) {
		logger.error(RizomError.UNAUTHORIZED)
		throw new RizomError(RizomError.UNAUTHORIZED);
	}
	return args;
};
