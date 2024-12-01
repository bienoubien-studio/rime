import { hashedPassword, panelUsersCollection } from '$lib/collection/auth/usersConfig.server.js';
import { usersFields } from '$lib/collection/auth/usersFields.js';
import { hasProps } from 'rizom/utils/object.js';
import { isFormField, isRolesField } from '../../utils/field.js';
import { capitalize, toCamelCase } from '$lib/utils/string.js';
import { isUploadConfig } from '../utils.js';
import type { User } from 'rizom/types/auth.js';
import type { PrototypeSlug } from 'rizom/types/doc.js';
import type {
	BuiltCollectionConfig,
	CollectionConfig,
	ImageSizesConfig,
	PanelUsersConfig
} from 'rizom/types/config.js';
import type { AnyField } from 'rizom/types/fields.js';
import type { CollectionHooks } from 'rizom/types/hooks.js';
import { findTitleField } from './fields/findTitle.server.js';
import { text } from 'rizom/fields/text/index.js';
import { compileField } from 'rizom/fields/compile.js';
import { SelectFieldBuilder } from 'rizom/fields/_builders/index.js';
import { date } from 'rizom/fields/index.js';

const buildHooks = async (collection: CollectionConfig): Promise<CollectionHooks> => {
	let hooks: CollectionHooks = { ...collection.hooks };
	if (collection.auth) {
		const authHooks = await import('$lib/collection/auth/hooks.server.js');
		const { beforeUpdate, beforeCreate, beforeDelete } = authHooks;
		hooks = {
			...hooks,
			beforeUpdate: [beforeUpdate, ...(hooks?.beforeUpdate || [])],
			beforeCreate: [beforeCreate, ...(hooks?.beforeCreate || [])],
			beforeDelete: [beforeDelete, ...(hooks?.beforeDelete || [])]
		};
	}
	if (collection.upload) {
		const uploadHooks = await import('rizom/collection/upload/hooks/index.server.js');
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
	let fields: AnyField[] = collection.fields.map(compileField);

	if (collection.auth) {
		const isNotPanelUsersCollection = !(collection.slug === 'users');
		if (isNotPanelUsersCollection) {
			fields.push(usersFields.email, hashedPassword);
			const rolesField = fields.find(isRolesField);
			if (!rolesField) {
				fields.push(usersFields.roles);
			}
		}
	}

	if (collection.upload) {
		if ('imageSizes' in collection && collection.imageSizes?.length) {
			const sizesFields = collection.imageSizes.map((size: ImageSizesConfig) =>
				text(toCamelCase(size.name)).hidden().toField()
			);
			fields = [...fields, ...sizesFields];
		}

		const mimeType = text('mimeType').hidden().toField();

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
			text('filename').hidden().toField(),
			text('filesize').hidden().toField()
		];
	}

	fields = [...fields, date('createdAt').hidden().toField(), date('updatedAt').hidden().toField()];

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
			SelectFieldBuilder.normalizeOptions(roleField)
		];
	}
	if (fields) {
		collection.fields.push(...fields.map(compileField));
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
