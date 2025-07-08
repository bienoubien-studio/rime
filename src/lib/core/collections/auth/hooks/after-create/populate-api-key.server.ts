import type { HookAfterCreate } from '$lib/core/config/types/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';

/**
 * After create populate the created API key
 * on document so user can see it once.
 */
export const populateAPIKey: HookAfterCreate<GenericDoc> = async (args) => {
	const { config } = args;

	const IS_API_AUTH = config.auth && config.auth.type === 'apiKey';
  
	if (IS_API_AUTH) {
		if (!args.context.apiKey) throw new RizomError(RizomError.OPERATION_ERROR, 'missing key @populateAPIKey');
		return {
			...args,
			doc: {
				...args.doc,
				apiKey: args.context.apiKey
			}
		};
	}

	return args;
};
