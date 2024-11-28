import { panelUsersCollection } from '$lib/auth/usersConfig.server.js';
import { usersFields } from '$lib/auth/usersFields.js';
import { hasProps } from 'rizom/utils/object.js';
import { isFormField, isRolesField } from '../../utils/field.js';
import { capitalize, toCamelCase } from '$lib/utils/string.js';
import { isUploadConfig } from '../utils.js';
import { augment } from './fields/augment.server.js';
import { compile } from './fields/compile.server.js';
import type { User } from 'rizom/types/auth.js';
import type { PrototypeSlug } from 'rizom/types/doc.js';
import type {
	BuiltCollectionConfig,
	CollectionConfig,
	ImageSizesConfig,
	PanelUsersConfig
} from 'rizom/types/config.js';
import type { AnyField, TextField } from 'rizom/types/fields.js';
import type { CollectionHooks } from 'rizom/types/hooks.js';
import { findTitleField } from './fields/findTitle.server.js';

const buildHooks = async (collection: CollectionConfig): Promise<CollectionHooks> => {
	let hooks: CollectionHooks = { ...collection.hooks };
	if (collection.auth) {
		const authHooks = await import('$lib/auth/hooks.server.js');
		const { beforeUpdate, beforeCreate, beforeDelete } = authHooks;
		hooks = {
			...hooks,
			beforeUpdate: [beforeUpdate, ...(hooks?.beforeUpdate || [])],
			beforeCreate: [beforeCreate, ...(hooks?.beforeCreate || [])],
			beforeDelete: [beforeDelete, ...(hooks?.beforeDelete || [])]
		};
	}
	if (collection.upload) {
		const uploadHooks = await import('../../upload/hooks/index.server.js');
		const { castBase64ToFile, processFileUpload, beforeDelete } = uploadHooks;
		hooks = {
			...hooks,
			beforeUpdate: [castBase64ToFile, processFileUpload, ...(hooks?.beforeUpdate || [])],
			beforeCreate: [castBase64ToFile, processFileUpload, ...(hooks?.beforeCreate || [])],
			beforeDelete: [beforeDelete, ...(hooks?.beforeDelete || [])]
		};
	}
	return hooks;
};

const buildFields = (collection: CollectionConfig): AnyField[] => {
	//
	let fields: AnyField[] = collection.fields.reduce(compile, []).reduce(augment, []);

	if (collection.auth) {
		const isNotPanelUsersCollection = !(collection.slug === 'users');
		if (isNotPanelUsersCollection) {
			fields.push(usersFields.email, {
				name: 'hashedPassword',
				type: 'text',
				required: true,
				hidden: true
			});
			const rolesField = fields.find(isRolesField);
			if (!rolesField) {
				fields.push(usersFields.roles);
			}
		}
	}

	if (collection.upload) {
		if ('imageSizes' in collection && collection.imageSizes?.length) {
			const sizesFields: TextField[] = collection.imageSizes.map((size: ImageSizesConfig) => ({
				name: toCamelCase(size.name),
				type: 'text',
				hidden: true
			}));
			fields = [...fields, ...sizesFields];
		}

		const mimeType: TextField = { name: 'mimeType', type: 'text', hidden: true };
		if ('accept' in collection) {
			mimeType.validate = (value: string) => {
				return (
					collection.accept.includes(value) ||
					`File should be the type of ${collection.accept.toString()}`
				);
			};
		}
		fields = [
			...fields,
			mimeType,
			{ name: 'filename', type: 'text', hidden: true },
			{ name: 'filesize', type: 'text', hidden: true }
		];
	}

	fields = [
		...fields,
		{ name: 'createdAt', type: 'date', hidden: true },
		{ name: 'updatedAt', type: 'date', hidden: true }
	];

	return fields;
};

export const buildCollection = async (
	collection: CollectionConfig
): Promise<BuiltCollectionConfig> => {
	const fields: AnyField[] = buildFields(collection);

	// Add generic documents title field if not defined
	const addAsTitle = () => {
		const fieldTitle = findTitleField(fields);
		if (fieldTitle) return fieldTitle.name;
		if (collection.upload) return 'filename';
		if (collection.auth) return 'email';
		return 'id';
	};

	// Add hooks
	const hooks = await buildHooks(collection);

	// Augment
	if (isUploadConfig(collection)) {
		const thumbnailName = collection.panelThumbnail || 'panelThumbnail';

		if (hasProps(collection, ['imageSizes'])) {
			const isPanelThumbnailInSizes = collection.imageSizes.some(
				(size: ImageSizesConfig) => size.name === collection.panelThumbnail
			);
			if (!isPanelThumbnailInSizes) {
				collection.imageSizes = [...collection.imageSizes, { name: thumbnailName, width: 600 }];
			}
		} else {
			collection.imageSizes = [{ name: thumbnailName, width: 600 }];
		}

		collection.panelThumbnail = thumbnailName;
	}

	return {
		...collection,
		slug: collection.slug as PrototypeSlug,
		label: collection.label
			? collection.label
			: { singular: capitalize(collection.slug), plural: capitalize(collection.slug) },
		asTitle: addAsTitle(),
		type: 'collection',
		fields,
		hooks,
		access: {
			create: (user?: User) => !!user,
			read: (user?: User) => !!user,
			update: (user?: User) => !!user,
			delete: (user?: User) => !!user,
			...collection.access
		}
	};
};

export const mergePanelUsersCollectionWithDefault = ({
	roles,
	fields,
	access,
	group
}: PanelUsersConfig = {}) => {
	const collection = { ...panelUsersCollection };
	if (roles) {
		const adminInRoles = roles.find((role) => role.value === 'admin');
		const roleField = {
			...usersFields.roles,
			options: roles
		};
		if (!adminInRoles) {
			roleField.options = [{ value: 'admin', label: 'Administrator' }, ...roles];
		}
		collection.fields = [
			...collection.fields.filter(isFormField).filter((f) => f.name !== 'roles'),
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
	return collection;
};
