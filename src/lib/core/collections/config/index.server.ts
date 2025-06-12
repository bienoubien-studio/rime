import { panelUsersCollection } from '$lib/core/collections/auth/config/usersConfig.server.js';
import { usersFields } from '$lib/core/collections/auth/config/usersFields.js';
import type { BuiltCollection, Collection, PanelUsersConfig } from '$lib/core/config/types/index.js';
import type { CollectionHooks } from '$lib/core/config/types/hooks.js';
import { FormFieldBuilder } from '$lib/fields/builders/index.js';

const buildHooks = async (collection: Collection<any>): Promise<CollectionHooks<any>> => {
	let hooks: CollectionHooks<any> = { ...collection.hooks };
	if (collection.auth) {
		const authHooks = await import('rizom/core/collections/auth/hooks/hooks.server.js');
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
		const uploadHooks = await import('$lib/core/collections/upload/hooks/index.server.js');
		const { castBase64ToFile, processFileUpload, beforeDelete, populateSizes } = uploadHooks;
		hooks = {
			...hooks,
			beforeUpdate: [castBase64ToFile, processFileUpload, ...(hooks?.beforeUpdate || [])],
			beforeCreate: [castBase64ToFile, processFileUpload, ...(hooks?.beforeCreate || [])],
			beforeDelete: [beforeDelete, ...(hooks?.beforeDelete || [])],
			beforeRead: [populateSizes, ...(hooks?.beforeRead || [])]
		};
	}
	if (collection.url) {
		const urlHooks = await import('$lib/core/collections/config/hooks/url.server.js');
		const { populateURL } = urlHooks;
		hooks = {
			...hooks,
			beforeRead: [populateURL, ...(hooks?.beforeRead || [])]
		};
	}
	if (collection.nested) {
		const nestedHooks = await import('$lib/core/collections/nested/hooks/index.server.js');
		const { addChildrenProperty } = nestedHooks;
		hooks = {
			...hooks,
			beforeRead: [addChildrenProperty, ...(hooks?.beforeRead || [])]
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
	panel,
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
	if (panel?.group) {
		collection.panel = { ...collection.panel, group: panel?.group };
	}
	if (label) {
		collection.label = label;
	}
	return collection;
};
