import type {
	CollectionHookBeforeCreate,
	CollectionHookBeforeDelete,
	CollectionHookBeforeUpdate
} from 'rizom/types/hooks.js';
import { pick } from 'rizom/utils/object';

export const beforeCreate: CollectionHookBeforeCreate = async (args) => {
	const { rizom } = args;
	// const isCurrentUserAdmin = args.event && args.event.locals.user?.roles.includes('admin')

	const isAdminCreation =
		'roles' in args.data && Array.isArray(args.data.roles) && !!args.data.roles.includes('admin');
	const authUserId = await rizom.auth.createAuthUser({
		email: args.data.email,
		password: args.data.password,
		name: args.data.name,
		slug: args.config.slug,
		role: isAdminCreation ? 'admin' : 'regular'
	});

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

	const hasAuthValues = Object.keys(args.data).some((key) => {
		return ['email', 'name', 'password', 'roles'].includes(key) && !!args.data[key];
	});

	if (hasAuthValues) {
		const hasPassword = 'password' in args.data;
		const hasName = 'name' in args.data;
		const hasEmail = 'email' in args.data;
		const hasRoles = 'roles' in args.data && Array.isArray(args.data.roles);

		const hasAuthValues = hasPassword || hasName || hasEmail || hasRoles;

		if (hasAuthValues) {
			const authUserId = await rizom.auth.getAuthUserId({
				slug: args.config.slug,
				id: args.originalDoc.id
			});

			if (!authUserId) {
				return args;
			}

			const impersonatedSession = await rizom.auth.betterAuth.api.impersonateUser({
				body: { userId: authUserId },
				headers: args.event?.request.headers,
				asResponse: true
			});

			if (hasName) {
				// console.log('hasName', impersonatedSession.session.token);
				await rizom.auth.betterAuth.api.updateUser({
					body: { name: args.data.name, table: args.config.slug },
					use: impersonatedSession,
					headers: args.event?.request.headers
				});
			}
			// console.log(3);
			// if (hasEmail) {
			// 	await rizom.auth.betterAuth.api.changeEmail({
			// 		body: {
			// 			newEmail: args.data.email
			// 		},
			// 		token: impersonatedSession.session.token
			// 	});
			// }
			// console.log(4);
			// await rizom.auth.betterAuth.api.stopImpersonating({ headers: args.event?.request.headers });
			// console.log(5);
		}
		// 	if (hasRoles) {
		// 		rizom.auth.betterAuth.api.setRole({
		// 			body: {
		// 				userId: authUserId,
		// 				role: !!args.data.roles.includes('admin') ? 'admin' : 'regular'
		// 			}
		// 		});
		// 	}
		// 	if (hasEmail) {
		// 	}
		// }

		// if (hasEmail && authUserId) {
		// 	rizom.auth.betterAuth.api.changeEmail({
		// 		body: {
		// 			newEmail: args.data.email
		// 		},
		// 		use: {}
		// 	});
		// }
	}
	// const authUserId = await rizom.auth.createAuthUser({
	// 	email: args.data.email,
	// 	password: args.data.password,
	// 	name: args.data.name,
	// 	slug: args.config.slug
	// });
	return args;
};

export const beforeDelete: CollectionHookBeforeDelete = async (args) => {
	const { doc, rizom } = args;
	await rizom.auth.deleteAuthUserById(doc.authUserId);
	return args;
};
