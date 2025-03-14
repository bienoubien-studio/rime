import { date, text } from 'rizom/fields';
import type { Area } from 'rizom/types';
import type { OmitPreservingDiscrimination } from 'rizom/types/util';
import { capitalize } from 'rizom/util/string';

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
