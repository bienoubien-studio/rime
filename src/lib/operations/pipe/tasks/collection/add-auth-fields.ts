import type { CompiledCollection, GenericDoc } from 'rizom/types';
import type { Task } from '../../index.server';
import { usersFields } from 'rizom/collection/auth/usersFields';

export const addAuthFields: Task<CompiledCollection> = async (ctx, next) => {
	/** Add Password and ConfirmPassword so validation includes these fields */
	if (ctx.config.auth) {
		ctx.config.fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	await next();
};
