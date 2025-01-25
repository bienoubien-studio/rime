import { RizomError } from '../../errors/error.server';
import type {
	CollectionHookBeforeCreate,
	CollectionHookBeforeDelete,
	CollectionHookBeforeUpdate
} from 'rizom/types/hooks.js';

export const beforeCreate: CollectionHookBeforeCreate = async (args) => {
	const { rizom } = args;

	const isAdminCreation =
		'roles' in args.data && Array.isArray(args.data.roles) && !!args.data.roles.includes('admin');

	const authUserId = await rizom.auth.createAuthUser({
		email: args.data.email,
		password: args.data.password,
		name: args.data.name,
		slug: args.config.slug,
		role: isAdminCreation ? 'admin' : 'user'
	});

	delete args.data.password;

	return {
		...args,
		data: {
			...args.data,
			authUserId
		}
	};
};

export const beforeUpdate: CollectionHookBeforeUpdate = async (args) => {
	const { rizom } = args;

	const rolesChanged = 'roles' in args.data && Array.isArray(args.data.roles);

	if (rolesChanged) {
		const authUserId = await rizom.auth.getAuthUserId({
			slug: args.config.slug,
			id: args.originalDoc.id
		});

		if (!authUserId) {
			throw new RizomError('user not found');
		}

		const hasAdminRole = args.data.roles.includes('admin');

		await rizom.auth.betterAuth.api.setRole({
			body: { userId: authUserId, role: hasAdminRole ? 'admin' : 'user' },
			headers: args.event?.request.headers
		});
	}

	return args;
};

export const beforeDelete: CollectionHookBeforeDelete = async (args) => {
	const { doc, rizom } = args;
	await rizom.auth.deleteAuthUserById({ id: doc.authUserId, headers: args.event?.request.headers });
	return args;
};
