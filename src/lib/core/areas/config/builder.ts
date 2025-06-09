import { text } from '$lib/fields/text/index.js';
import { date } from '$lib/fields/date/index.js';
import type { Area } from '$lib/core/config/types/index.js';
import type { OmitPreservingDiscrimination } from '$lib/util/types.js';
import { capitalize } from '$lib/util/string.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';

type AreaWithoutSlug<S> = OmitPreservingDiscrimination<Area<S>, 'slug'>;

export function area<S extends string>(slug: S, config: AreaWithoutSlug<S>): Area<S> {
	const fields: typeof config.fields = [
		...config.fields,
		text('editedBy').hidden(),
		date('createdAt').hidden(),
		date('updatedAt').hidden()
	];

	if (config.url) {
		fields.push(text('url').hidden().localized());
	}

	// Augment Status
	if (config.versions) {
		if (config.versions === true) {
			config.versions = {
				draft: false,
				autoSave: false,
				maxVersions: 20
			};
		}
		if (!config.versions.maxVersions) {
			config.versions.maxVersions = 20
		}
		if (config.versions.draft) {
			fields.push(text('status').defaultValue(VERSIONS_STATUS.DRAFT).hidden());
		}
	} else {
		config.versions = false;
	}
	
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
