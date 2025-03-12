import type { GenericDoc } from 'rizom/types/index.js';
import type {
	CollectionHookAfterCreate,
	CollectionHookBeforeCreate,
	CollectionHookBeforeDelete,
	CollectionHookBeforeUpdate
} from 'rizom/types/hooks.js';

/////////////////////////////////////////////
// Create a better-auth user before creation
//////////////////////////////////////////////
export const beforeCreate: CollectionHookBeforeCreate = async (args) => {
	const { rizom } = args;

	const authUserId = await rizom.auth.createAuthUser({
		email: args.data.email,
		password: args.data.password,
		name: args.data.name,
		slug: args.config.slug
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

//////////////////////////////////////////////
// After creation set proper better-auth role
// as it's not working with signupEmail
//////////////////////////////////////////////
export const afterCreate: CollectionHookAfterCreate<GenericDoc> = async (args) => {
	const { rizom, event, doc } = args;
	const isAdmin = 'roles' in doc && Array.isArray(doc.roles) && doc.roles.includes('admin');
	if (isAdmin) {
		await rizom.auth.setAuthUserRole({
			roles: doc.roles,
			userId: doc.id,
			slug: args.config.slug,
			headers: event.request.headers
		});
	}
	return args;
};

//////////////////////////////////////////////
// After update set proper better-auth role
//////////////////////////////////////////////
export const beforeUpdate: CollectionHookBeforeUpdate<GenericDoc> = async (args) => {
	const { rizom, event } = args;
	const rolesChanged = 'roles' in args.data && Array.isArray(args.data.roles);

	if (rolesChanged) {
		await rizom.auth.setAuthUserRole({
			roles: args.data.roles,
			userId: args.originalDoc.id,
			slug: args.config.slug,
			headers: event.request.headers
		});
	}

	return args;
};

//////////////////////////////////////////////
// After delete delete better-auth user
//////////////////////////////////////////////
export const afterDelete: CollectionHookBeforeDelete = async (args) => {
	const { doc, rizom } = args;
	await rizom.auth.deleteAuthUserById({
		id: doc.authUserId,
		headers: args.event.request.headers
	});
	return args;
};
