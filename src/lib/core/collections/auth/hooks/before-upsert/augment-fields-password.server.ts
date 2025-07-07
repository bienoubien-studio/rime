import type { HookBeforeUpsert } from '$lib/core/config/types/hooks.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import { usersFields } from '../../config/usersFields.js';

export const augmentFieldsPassword: HookBeforeUpsert<'collection', GenericDoc> = async (args) => {
	let { config } = args;

	const IS_PASSWORD_AUTH = config.auth && typeof config.auth !== 'boolean' && config.auth.type === 'password';

	if (IS_PASSWORD_AUTH) {
		config = {
			...config,
			fields: [...config.fields, usersFields.password.raw, usersFields.confirmPassword.raw]
		};
	}
	
	return {
		...args,
		config
	};
};
