import { text } from '$lib/fields/text/index.js';
import { date } from '$lib/fields/date/index.js';
import { capitalize } from '$lib/util/string.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';
import type { Area } from '$lib/core/config/types/index.js';
import type { AreaWithoutSlug, AugmentAreaFn } from './types.js';

/**
 * Function to define an Area
 */
export function area<S extends string>(slug: S, config: AreaWithoutSlug<S>): Area<S> {
	let fields: typeof config.fields = [...config.fields];

	({ config, fields } = augmentMetas({ config, fields }));
	({ config, fields } = augmentVersions({ config, fields }));

	return {
		...config,
		slug,
		label: config.label ? config.label : capitalize(slug),
		fields: fields,
		access: {
			create: (user) => !!user,
			read: (user) => !!user,
			update: (user) => !!user,
			delete: (user) => !!user,
			...config.access
		}
	};
}

/**
 * Add updatedAt createdAt editedBy fields
 */
const augmentMetas: AugmentAreaFn = ({ config, fields }) => {
	fields.push(
		//
		text('editedBy').hidden(),
		date('createdAt').hidden(),
		date('updatedAt').hidden()
	);
	return { config, fields };
};

/**
 * Add versions related fields and
 * nomalize config.versions prop
 */
const augmentVersions: AugmentAreaFn = ({ config, fields }) => {
	if (config.versions) {
		if (config.versions === true) {
			config.versions = {
				draft: false,
				autoSave: false,
				maxVersions: 20
			};
		}
		if (!config.versions.maxVersions) {
			config.versions.maxVersions = 20;
		}
		if (config.versions.draft) {
			fields.push(text('status').defaultValue(VERSIONS_STATUS.DRAFT).hidden());
		}
	} else {
		config.versions = false;
	}
	return { config, fields };
};
