import type { HookAfterDelete } from '$lib/core/config/types/hooks.js';
import type { GenericDoc } from '$lib/core/types/doc.js';

/**
 * After delete, delete better-auth user
 */
export const deleteBetterAuthUser: HookAfterDelete<GenericDoc> = async (args) => {
	const { doc, rizom, config } = args;
	const IS_API_AUTH = config.auth && config.auth?.type === 'apiKey';

	if (IS_API_AUTH) {
		await rizom.auth.betterAuth.api.deleteApiKey({
			headers: args.event.request.headers,
			body: {
				keyId: doc.apiKeyId
			}
		});
	} else {
		await rizom.auth.deleteAuthUserById({
			id: doc.authUserId,
			headers: args.event.request.headers
		});
	}
	
	return args;
};
