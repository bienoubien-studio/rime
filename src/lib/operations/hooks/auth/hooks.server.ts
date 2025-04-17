import { RizomError } from '$lib/errors';
import type { GenericDoc } from '$lib/types/doc.js';
import type {
	CollectionHookAfterCreate,
	CollectionHookAfterDelete,
	CollectionHookBeforeCreate,
	CollectionHookBeforeDelete,
	CollectionHookBeforeUpdate
} from '$lib/types/hooks.js';

/////////////////////////////////////////////
// Create a better-auth user before creation
//////////////////////////////////////////////
export const beforeCreate: CollectionHookBeforeCreate = async (args) => {
	const { rizom } = args;

	// Prevent superAdmin value to be set on creation
	if('isSuperAdmin' in args.data){
		throw new RizomError(RizomError.UNAUTHORIZED)
	}

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
// Only admin can change roles
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
// Before update : 
// - set proper better-auth role
// - prevent superadmin to be changed by someone else
//////////////////////////////////////////////
export const beforeUpdate: CollectionHookBeforeUpdate<GenericDoc> = async (args) => {
	const { rizom, event, originalDoc } = args;
	const rolesChanged = 'roles' in args.data && Array.isArray(args.data.roles);

	const isSuperAdminMutation = await rizom.auth.isSuperAdmin(originalDoc.id)
	
	// Prevent super admin user to be changed by someone
	if( isSuperAdminMutation && !event.locals.user?.isSuperAdmin){
		throw new RizomError(RizomError.UNAUTHORIZED)
	}

	// Prevent superAdmin value to be changed
	if('isSuperAdmin' in args.data){
		throw new RizomError(RizomError.UNAUTHORIZED)
	}

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
// Prevent superadmin to be deleted
//////////////////////////////////////////////
export const beforeDelete: CollectionHookBeforeDelete = async (args) => {
	const { doc, rizom } = args;
	const isSuperAdminDeletion = await rizom.auth.isSuperAdmin(doc.id)
	if(isSuperAdminDeletion){
		throw new RizomError(RizomError.UNAUTHORIZED, "This user can't be deleted")
	}
	return args;
};


//////////////////////////////////////////////
// After delete, delete better-auth user
//////////////////////////////////////////////
export const afterDelete: CollectionHookAfterDelete = async (args) => {
	const { doc, rizom } = args;
	await rizom.auth.deleteAuthUserById({
		id: doc.authUserId,
		headers: args.event.request.headers
	});
	return args;
};
