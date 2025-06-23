import { RizomError } from '$lib/core/errors/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type {
	HookAfterCreate,
	HookAfterDelete,
	HookBeforeCreate,
	HookBeforeDelete,
	HookBeforeUpdate
} from '$lib/core/config/types/hooks.js';

/****************************************************/
/* Create a better-auth user before creation
/****************************************************/
export const createBetterAuthUser: HookBeforeCreate<GenericDoc> = async (args) => {
	const { rizom } = args;

	// Prevent superAdmin value to be set on creation
	if ('isSuperAdmin' in args.data) {
		throw new RizomError(RizomError.UNAUTHORIZED);
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

/****************************************************/
/* After creation set proper better-auth role
// as it's not working with signupEmail
// Only admin can change roles
/****************************************************/
export const afterCreateSetAuthUserRole: HookAfterCreate<GenericDoc> = async (args) => {
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

/****************************************************/
/* Before update :
// - set proper better-auth role
/****************************************************/
export const forwardRolesToBetterAuth: HookBeforeUpdate<'collection', GenericDoc> = async (args) => {
	const { rizom, event, originalDoc } = args;
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

/****************************************************/
/* Before update :
// - prevent superadmin to be changed by someone else
/****************************************************/
export const preventSuperAdminMutation: HookBeforeUpdate<'collection', GenericDoc> = async (args) => {
	const { rizom, event, originalDoc } = args;
	const rolesChanged = 'roles' in args.data && Array.isArray(args.data.roles);

	const isSuperAdminMutation = await rizom.auth.isSuperAdmin(originalDoc.id);

	// Prevent super admin user to be changed by someone
	if (isSuperAdminMutation && !event.locals.user?.isSuperAdmin) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	// Prevent "admin" roles of superadmin to be deleted
	if (isSuperAdminMutation && rolesChanged && !args.data.roles.includes('admin')) {
		args.data.roles.push('admin');
	}

	// Prevent superAdmin value to be changed
	if ('isSuperAdmin' in args.data) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	return args;
};

/****************************************************/
/* Prevent superadmin to be deleted
/****************************************************/
export const preventSupperAdminToBeDeleted: HookBeforeDelete<GenericDoc> = async (args) => {
	const { doc, rizom } = args;
	const isSuperAdminDeletion = await rizom.auth.isSuperAdmin(doc.id);
	if (isSuperAdminDeletion) {
		throw new RizomError(RizomError.UNAUTHORIZED, "This user can't be deleted");
	}
	return args;
};

/****************************************************/
/* After delete, delete better-auth user
/****************************************************/
export const deleteBetterAuthUser: HookAfterDelete<GenericDoc> = async (args) => {
	const { doc, rizom } = args;
	await rizom.auth.deleteAuthUserById({
		id: doc.authUserId,
		headers: args.event.request.headers
	});
	return args;
};
