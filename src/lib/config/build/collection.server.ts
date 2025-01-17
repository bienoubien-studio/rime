import { hashedPassword, panelUsersCollection } from '$lib/collection/auth/usersConfig.server.js';
import { usersFields } from '$lib/collection/auth/usersFields.js';
import { hasProps } from 'rizom/utils/object.js';
import { isFormField, isRolesField } from '../../utils/field.js';
import { capitalize, toCamelCase } from '$lib/utils/string.js';
import { isUploadConfig } from '../utils.js';
import type { User } from 'rizom/types/auth.js';
import type { CollectionSlug } from 'rizom/types/doc.js';
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
import { FieldBuilder } from 'rizom/fields/_builders/index.js';
import { date, relation } from 'rizom/fields/index.js';

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

const buildFields = (collection: CollectionConfig): FieldBuilder<AnyField>[] => {
	//
	let fields = collection.fields;

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
				text(toCamelCase(size.name)).hidden()
			);
			fields = [...fields, ...sizesFields];
		}

		const mimeType = text('mimeType').hidden();

		if ('accept' in collection) {
			mimeType.raw.validate = (value: string) => {
				return (
					collection.accept.includes(value) ||
					`File should be the type of ${collection.accept.toString()}`
				);
			};
		}
		fields = [...fields, mimeType, text('filename').hidden(), text('filesize').hidden()];
	}

	fields = [...fields, date('createdAt').hidden(), date('updatedAt').hidden()];

	return fields;
};

export const buildCollection = async (
	collection: CollectionConfig
): Promise<BuiltCollectionConfig> => {
	const fields = buildFields(collection);

	// Add generic documents title field if not defined
	const addAsTitle = () => {
		const fieldTitle = findTitleField(collection.fields);
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

	fields.push(relation('_editedBy').to('users').hidden());

	return {
		...collection,
		slug: collection.slug as CollectionSlug,
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
		const hasAdminRole = roles.find((role) => role.value === 'admin');

		if (!hasAdminRole) {
			roles = [{ value: 'admin', label: 'Administrator' }, ...roles];
		}
		const roleField = usersFields.roles.options(...roles);

		collection.fields = [
			...collection.fields
				.filter((field) => isFormField(field.raw))
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
	return collection;
};
