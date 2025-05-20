import { text } from '$lib/fields/text/index.js';
import { date } from '$lib/fields/date/index.js';
import { isUploadConfig } from '$lib/util/config.js';
import { capitalize, toCamelCase } from '$lib/util/string.js';
import { isRolesField } from '$lib/util/field.js';
import { findTitleField } from '../fields/findTitle.js';
import { usersFields } from '../../auth/usersFields.js';
import type { Collection, ImageSizesConfig } from '$lib/types/config.js';
import type { User } from '$lib/types/auth.js';
import type { CollectionWithoutSlug } from './types';
import { PANEL_USERS } from '$lib/constant.js';
import { relation } from '$lib/fields/relation/index.js';
import { number } from '$lib/fields/number/index.js';
import { select } from 'rizom/fields/select/index.js';
import type { CollectionSlug } from '$lib/types/index.js';

export function collection<S extends string>(
	slug: S,
	config: CollectionWithoutSlug<S>
): Collection<S> {
	let fields: typeof config.fields = [...config.fields];

	// Augment Upload fields
	if (isUploadConfig(config)) {
		// Add panel thumbnail size if not already present
		const isPanelThumbnailInSizes =
			config.imageSizes &&
			config.imageSizes.some((size: ImageSizesConfig) => size.name === 'thumbnail');
		if (!isPanelThumbnailInSizes) {
			const thumbnailSize = { name: 'thumbnail', width: 400, compression: 60 };
			config.imageSizes = [thumbnailSize, ...(config.imageSizes || [])];
		}

		// Add image size fields
		if ('imageSizes' in config && config.imageSizes?.length) {
			const sizesFields = config.imageSizes.map((size: ImageSizesConfig) =>
				text(toCamelCase(size.name)).hidden()
			);
			fields = [...fields, ...sizesFields];
		}

		// Add mimeType field
		const mimeType = text('mimeType').table({ sort: true, position: 99 }).hidden();

		// Add validation if accept is defined
		if ('accept' in config) {
			const allowedMimeTypes = config.accept;
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

	// Augment Status
	if (config.versions) {
		if (config.versions === true) {
			config.versions = {
				draft: false, autoSave: false, maxVersions: 4
			};
		}else if(config.versions.draft){
			fields.push(select('status').options('draft', 'published').defaultValue('draft').hidden());
		}
	}else{
		config.versions = false
	}
	
	if(config.nested){
		fields.push(number('nestedPosition').defaultValue(0).hidden());
		fields.push(relation('parent').to(slug as CollectionSlug).hidden());
	}
	
	if(config.url){
		fields.push(text('url').hidden().localized());
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
