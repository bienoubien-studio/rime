import { panelUsersCollection } from '$lib/config/auth/usersConfig.server.js';
import { usersFields } from '$lib/config/auth/usersFields.js';
import type { BuiltCollection, Collection, PanelUsersConfig } from '$lib/types/config.js';
import type { CollectionHooks } from '$lib/types/hooks.js';
import { FormFieldBuilder } from '$lib/fields/builders/index.js';

const buildHooks = async (collection: Collection<any>): Promise<CollectionHooks<any>> => {
	let hooks: CollectionHooks<any> = { ...collection.hooks };
	if (collection.auth) {
		const authHooks = await import('rizom/operations/hooks/auth/hooks.server.js');
		const { beforeUpdate, beforeCreate,beforeDelete, afterDelete, afterCreate } = authHooks;
		hooks = {
			...hooks,
			beforeUpdate: [beforeUpdate, ...(hooks?.beforeUpdate || [])],
			beforeCreate: [beforeCreate, ...(hooks?.beforeCreate || [])],
			afterCreate: [afterCreate, ...(hooks?.afterCreate || [])],
			beforeDelete: [beforeDelete, ...(hooks?.beforeDelete || [])],
			afterDelete: [afterDelete, ...(hooks?.afterDelete || [])]
		};
	}
	if (collection.upload) {
		const uploadHooks = await import('$lib/operations/hooks/upload/index.server.js');
		const { castBase64ToFile, processFileUpload, beforeDelete, populateSizes } = uploadHooks;
		hooks = {
			...hooks,
			beforeUpdate: [castBase64ToFile, processFileUpload, ...(hooks?.beforeUpdate || [])],
			beforeCreate: [castBase64ToFile, processFileUpload, ...(hooks?.beforeCreate || [])],
			beforeDelete: [beforeDelete, ...(hooks?.beforeDelete || [])],
			beforeRead: [populateSizes, ...(hooks?.beforeRead || [])]
		};
	}
	 
	return hooks;
};

export const buildCollection = async (collection: Collection<any>): Promise<BuiltCollection> => {
	const hooks = await buildHooks(collection);
	return {
		...collection,
		type: 'collection',
		hooks
	} as BuiltCollection;
};

export const mergePanelUsersCollectionWithDefault = ({
	roles,
	fields,
	access,
	group,
	label
}: PanelUsersConfig = {}) => {
	const collection = { ...panelUsersCollection };
	if (roles) {
		const hasAdminRole = roles.find((role) => role.value === 'admin');
		const otherRoles = roles.filter((role) => role.value !== 'admin');

		if (!hasAdminRole) {
			roles = [{ value: 'admin' }, ...roles];
		}

		if (otherRoles.length === 0) {
			roles.push({ value: 'user' });
		}

		const defaultRole = roles.filter((role) => role.value !== 'admin')[0].value;

		const roleField = usersFields.roles.options(...roles).defaultValue(defaultRole);

		collection.fields = [
			...collection.fields
				.filter((field) => field instanceof FormFieldBuilder)
				.filter((field) => field.raw.name !== 'roles'),
			roleField
		];
	}
	if (fields) {
		collection.fields.push(...fields);
	}
	if (access) {
		collection.access = {
			...collection.access,
			...access
		};
	}
	if (group) {
		collection.group = group;
	}
	if (label) {
		collection.label = label;
	}
	return collection;
};
