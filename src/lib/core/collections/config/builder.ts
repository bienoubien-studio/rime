import { text } from '$lib/fields/text/index.js';
import { date } from '$lib/fields/date/index.js';
import { capitalize, toCamelCase } from '$lib/util/string.js';
import { isRolesField } from '$lib/util/field.js';
import { findTitleField } from '$lib/core/config/build/fields/findTitle.js';
import { usersFields } from '$lib/core/collections/auth/config/usersFields.js';
import type { Collection, ImageSizesConfig } from '$lib/core/config/types/index.js';
import type { User } from '$lib/core/collections/auth/types.js';
import type { AugmentCollectionFn, CollectionWithoutSlug } from './types.js';
import { PANEL_USERS, VERSIONS_STATUS } from '$lib/core/constant.js';
import { number } from '$lib/fields/number/index.js';

/**
 * Function to define a collection
 */
export function collection<S extends string>(slug: S, config: CollectionWithoutSlug<S>): Collection<S> {
	let fields: typeof config.fields = [...config.fields];

	({ config, fields } = augmentUpdload({ config, fields }));
	({ config, fields } = augmentNested({ config, fields }));
	({ config, fields } = augmentVersions({ config, fields }));

	if (config.auth && slug !== PANEL_USERS) {
		({ config, fields } = augmentAuth({ config, fields }));
	}

	({ config, fields } = augmentMetas({ config, fields }));

	config = setTitle(config);

	return {
		...config,
		slug,
		label: config.label ? config.label : { singular: capitalize(slug), plural: capitalize(slug), gender: 'm' },
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

/**
 * Set asTitle to the one defined or fallback to
 * filename for upload, email for auth, or id
 */
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


/**
 * Add updatedAt createdAt editedBy fields
 */
const augmentMetas: AugmentCollectionFn = ({ config, fields }) => {
	fields.push(
		//
		text('editedBy').hidden(),
		date('createdAt').hidden(),
		date('updatedAt').hidden()
	);
	return { config, fields };
};

/**
 * Add auth email and roles fields
 */
const augmentAuth: AugmentCollectionFn = ({ config, fields }) => {
	fields.push(usersFields.email);
	const rolesField = fields.find((field) => isRolesField(field.raw));
	if (!rolesField) {
		fields.push(usersFields.roles);
	}
	return {
		config,
		fields
	};
};

/**
 * Normalize versions prop and add status field if config.versions.drat is true
 */
const augmentVersions: AugmentCollectionFn = ({ config, fields }) => {
	if (config.versions) {
		if (config.versions === true) {
			config.versions = {
				draft: false,
				autoSave: false,
				maxVersions: 12
			};
		}
		if (!config.versions.maxVersions) {
			config.versions.maxVersions = 12;
		}
		if (config.versions.draft) {
			fields.push(text('status').defaultValue(VERSIONS_STATUS.DRAFT).hidden());
		}
	} else {
		config.versions = false;
	}
	return { config, fields };
};

/**
 * Add root table fields _parent and _position
 * for nested collection
 */
const augmentNested: AugmentCollectionFn = ({ config, fields }) => {
	if (config.nested) {
		const _parentField = text('_parent').hidden()._root();
		// @TODO For now overwrite the toSchema method, it is ugly but it works
		// Later maybe add a field specific method to set a schema output
		_parentField.toSchema = () => `_parent: text('_parent').references((): any => pages.id, {onDelete: 'set null'})`;
		fields.push(_parentField);
		fields.push(number('_position').defaultValue(0).hidden()._root());
	}
	return { config, fields };
};

/**
 * Normalize config.upload and imagesSizes
 * add corresponding fields with validation if config.upload.accept is defined
 */
const augmentUpdload: AugmentCollectionFn = ({ config, fields }) => {
	if (config.upload) {
		// set an empty object for config.upload if it's true
		config.upload = config.upload === true ? {} : config.upload;
		// Add panel thumbnail size if not already present
		const isPanelThumbnailInSizes =
			config.upload.imageSizes && config.upload.imageSizes.some((size: ImageSizesConfig) => size.name === 'thumbnail');
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
		fields.push(mimeType, text('filename').hidden(), text('filesize').hidden());
	}
	return { config, fields };
};
