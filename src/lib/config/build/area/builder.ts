import { text } from '$lib/fields/text/index.js';
import { date } from '$lib/fields/date/index.js';
import type { Area } from '$lib/types/config.js';
import type { OmitPreservingDiscrimination } from '$lib/types/util.js';
import { capitalize } from '$lib/util/string.js';

type AreaWithoutSlug<S> = OmitPreservingDiscrimination<Area<S>, 'slug'>;

export function area<S extends string>(slug: S, config: AreaWithoutSlug<S>): Area<S> {
	return {
		...config,
		slug,
		label: config.label ? config.label : capitalize(slug),
		fields: [...config.fields, text('editedBy').hidden(), date('updatedAt').hidden()],
		access: {
			create: (user) => !!user,
			read: (user) => !!user,
			update: (user) => !!user,
			delete: (user) => !!user,
			...config.access
		}
	};
}
