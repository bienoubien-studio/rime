import { text } from '$lib/fields/text/index.js';
import { date } from '$lib/fields/date/index.js';
import { select } from '$lib/fields/select/index.js';
import type { Area } from '$lib/types/config.js';
import type { OmitPreservingDiscrimination } from '$lib/types/util.js';
import { capitalize } from '$lib/util/string.js';

type AreaWithoutSlug<S> = OmitPreservingDiscrimination<Area<S>, 'slug'>;

export function area<S extends string>(slug: S, config: AreaWithoutSlug<S>): Area<S> {

	let fields: typeof config.fields = [
		...config.fields,
		text('editedBy').hidden(),
		date('updatedAt').hidden()
	];

	if (config.url) {
		fields.push(text('url').hidden().localized());
	}

	// Augment Status
	if (config.versions) {
		if (config.versions === true) {
			config.versions = {
				draft: false, autoSave: false, maxVersions: 4
			};
		} else if (config.versions.draft) {
			fields.push(select('status').options('draft', 'published').defaultValue('draft').hidden());
		}
	} else {
		config.versions = false
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
