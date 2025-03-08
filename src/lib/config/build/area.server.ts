import type { BuiltArea, Area } from 'rizom/types';

import { findTitleField } from './fields/findTitle.server.js';
import type { AreaSlug } from 'rizom/types/doc';
import { capitalize } from 'rizom/util/string.js';
import { date, relation, text } from 'rizom/fields/index.js';

export const buildArea = (area: Area<any>): BuiltArea => {
	const fieldTitle = findTitleField(area.fields);

	return {
		...area,
		slug: area.slug as AreaSlug,
		type: 'area',
		label: area.label ? area.label : capitalize(area.slug),
		asTitle: fieldTitle ? fieldTitle.name : 'id',
		fields: [...area.fields, text('editedBy').hidden(), date('updatedAt').hidden()],
		access: {
			create: (user) => !!user,
			read: (user) => !!user,
			update: (user) => !!user,
			delete: (user) => !!user,
			...area.access
		}
	};
};
