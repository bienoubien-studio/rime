import { text } from '$lib/fields/text/index.js';
import { date } from '$lib/fields/date/index.js';
import { isUploadConfig } from '$lib/util/config.js';
import { capitalize, toCamelCase } from '$lib/util/string.js';
import { isRolesField } from '$lib/util/field.js';
import { findTitleField } from '$lib/core/config/build/fields/findTitle.js';
import { usersFields } from '$lib/core/collections/auth/config/usersFields.js';
import type { Collection, ImageSizesConfig } from '$lib/core/config/types/index.js';
import type { User } from '$lib/core/collections/auth/types.js';
import type { CollectionWithoutSlug } from './types.js';
import { PANEL_USERS, VERSIONS_STATUS } from '$lib/core/constant.js';
import { relation } from '$lib/fields/relation/index.js';
import { number } from '$lib/fields/number/index.js';
import type { CollectionSlug } from '$lib/types.js';

export function collection<S extends string>(
	slug: S,
	config: CollectionWithoutSlug<S>
): Collection<S> {
	let fields: typeof config.fields = [...config.fields];
	
	// Augment Upload fields
	if (config.upload) {
		// set an empty object for config.upload if it's true
		config.upload = config.upload === true ? {} : config.upload
		// Add panel thumbnail size if not already present
		const isPanelThumbnailInSizes =
			config.upload.imageSizes &&
			config.upload.imageSizes.some((size: ImageSizesConfig) => size.name === 'thumbnail');
		if (!isPanelThumbnailInSizes) {
			const thumbnailSize = { name: 'thumbnail', width: 400, compression: 60 };
			config.upload.imageSizes = [thumbnailSize, ...(config.upload.imageSizes || [])];
		}

		// Add image size fields
		if ('imageSizes' in config && config.upload.imageSizes?.length) {
			const sizesFields = config.upload.imageSizes.map((size: ImageSizesConfig) =>
				text(toCamelCase(size.name)).hidden()
			);
			fields = [...fields, ...sizesFields];
		}

		// Add mimeType field
		const mimeType = text('mimeType').table({ sort: true, position: 99 }).hidden();

		// Add validation if accept is defined
		if ('accept' in config.upload && Array.isArray(config.upload.accept)) {
			const allowedMimeTypes = config.upload.accept;
			mimeType.raw.validate = (value) => {
				return (
					(typeof value === 'string' && allowedMimeTypes.includes(value)) ||
					`File should be the type of ${allowedMimeTypes.toString()}`
				);
			};
		}

		// Add hidden fields
		fields.push(
			//
			mimeType,
			text('filename').hidden(),
			text('filesize').hidden()
		);
	}

	// Augment Nested
	if (config.nested) {
		const _parentField = text('_parent').hidden()._root()
		// @TODO For now overwrite the toSchema method, it is ugly but it works
		// Later maybe add a field specific method to set a schema output 
		_parentField.toSchema = () => `_parent: text('_parent').references((): any => pages.id, {onDelete: 'set null'})`
		fields.push(_parentField)
		fields.push(number('_position').defaultValue(0).hidden()._root())
	}
	
	// Augment Versions
	if (config.versions) {
		if (config.versions === true) {
			config.versions = {
				draft: false, autoSave: false, maxVersions: 4
			};
		} 
		if (!config.versions.maxVersions) {
			config.versions.maxVersions = 4
		}
		if(config.versions.draft){
			fields.push(text('status').defaultValue(VERSIONS_STATUS.DRAFT).hidden());
		}
	}else{
		config.versions = false
	}
	
	// Augment Auth fields
	if (config.auth) {
		const isNotPanelUsersCollection = slug !== PANEL_USERS;
		if (isNotPanelUsersCollection) {
			fields.push(usersFields.email);
			const rolesField = fields.find((field) => isRolesField(field.raw));
			if (!rolesField) {
				fields.push(usersFields.roles);
			}
		}
	}

	// Misc augment
	fields.push(
		//
		text('editedBy').hidden(),
		date('createdAt').hidden(),
		date('updatedAt').hidden()
	);

	config = setTitle(config);

	return {
		...config,
		slug,
		label: config.label
			? config.label
			: { singular: capitalize(slug), plural: capitalize(slug), gender: 'm' },
		fields,
		access: {
			create: (user?: User) => !!user,
			read: (user?: User) => !!user,
			update: (user?: User) => !!user,
			delete: (user?: User) => !!user,
			...config.access
		}
	};
}

export const setTitle = <T extends CollectionWithoutSlug<any>>(config: T) => {
	const addAsTitle = () => {
		const titleResult = findTitleField(config.fields);
		if (titleResult) return titleResult.path;
		if (config.upload) return 'filename';
		if (config.auth) return 'email';
		return 'id';
	};
	return {
		...config,
		asTitle: addAsTitle()
	};
};
