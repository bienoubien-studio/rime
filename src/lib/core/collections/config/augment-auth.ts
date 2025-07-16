import { PANEL_USERS } from '$lib/core/collections/auth/constant.server.js';
import { text } from '$lib/fields/text/index.server.js';
import { usersFields } from '../auth/fields.server.js';
import { select } from '$lib/fields/select/index.js';
import type { Collection } from '../../../types.js';
import type { AuthConfig } from '$lib/core/config/types/index.js';
import { access } from '$lib/util/access/index.js';

type Input = { slug: string; auth?: boolean | AuthConfig; fields: Collection<any>['fields'] };
type WithNormalizedAuth<T> = Omit<T, 'auth'> & { auth?: AuthConfig };

const withNormalizedAuth = <T extends { auth?: boolean | AuthConfig }>(config: T): WithNormalizedAuth<T> => {
	// Create a new object without the auth property
	const { auth, ...rest } = config;
	// Determine the normalized auth value
	let normalizedAuth: undefined | AuthConfig;

	if (typeof auth === 'boolean') {
		normalizedAuth = { type: 'password' };
	} else {
		normalizedAuth = auth;
	}

	// Return the new object with the normalized auth
	return {
		...rest,
		auth: normalizedAuth
	};
};

/**
 * Augment Auth collections :
 * - normalize config.auth
 * - add fields name, email fields
 * - check roles fields
 */
export const augmentAuth = <T extends Input>(config: T): WithNormalizedAuth<T> => {
	const normalizedAuthConfig = withNormalizedAuth(config);
	if (!normalizedAuthConfig.auth) return normalizedAuthConfig;

	// Augment Fields
	const IS_STAFF_COLLECTION = normalizedAuthConfig.slug === PANEL_USERS;
	const IS_GENERIC_COLLECTION = !IS_STAFF_COLLECTION;
	const IS_API_AUTH = normalizedAuthConfig.auth.type === 'apiKey';

	let roles = [...(normalizedAuthConfig.auth.roles || ['user'])];

	// Filter out 'admin' roles for non staff collection
	roles = IS_GENERIC_COLLECTION
		? roles.filter((role) => {
				if (typeof role === 'string' && role === 'admin') return false;
				if (typeof role !== 'string' && role.value === 'admin') return false;
				return true;
			})
		: roles;

	const rolesField = select('roles')
		.options(...roles)
		.many()
		.required();

	if (IS_GENERIC_COLLECTION) {
		rolesField.access({
			create: () => true,
			read: (user) => !!user,
			update: (user) => !!user
		});
	} else {
		rolesField.access({
			create: (user) => !!user && access.isAdmin(user),
			read: (user) => !!user && access.isAdmin(user),
			update: (user) => !!user && access.isAdmin(user)
		});
	}

	let fields = [
		usersFields.name.clone(),
		// Add email field for non api key auth type.
		...(!IS_API_AUTH ? [usersFields.email.clone()] : []),
		rolesField,
		...normalizedAuthConfig.fields,
		// Add apiKeyId for api key auth type.
		...(IS_API_AUTH ? [text('apiKeyId').hidden().readonly()] : [])
	];

	if (IS_API_AUTH) {
		const ownerIdField = text('ownerId')
			.hidden()
			.readonly()
			.generateSchema(() => `ownerId: text('onwer_id').references(() => staff.id, {onDelete: 'cascade'})`);
		fields.push(ownerIdField);
	}

	return { ...normalizedAuthConfig, fields };
};
