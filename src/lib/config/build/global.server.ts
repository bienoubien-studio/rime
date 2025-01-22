import type { BuiltGlobalConfig, GlobalConfig } from 'rizom/types';

import { findTitleField } from './fields/findTitle.server.js';
import type { GlobalSlug } from 'rizom/types/doc';
import { capitalize } from 'rizom/utils/string.js';
import { date, relation, text } from 'rizom/fields/index.js';

export const buildGlobal = (global: GlobalConfig): BuiltGlobalConfig => {
	const fieldTitle = findTitleField(global.fields);

	return {
		...global,
		slug: global.slug as GlobalSlug,
		type: 'global',
		label: global.label ? global.label : capitalize(global.slug),
		asTitle: fieldTitle ? fieldTitle.name : 'id',
		fields: [...global.fields, text('_editedBy').hidden(), date('updatedAt').hidden()],
		access: {
			create: (user) => !!user,
			read: (user) => !!user,
			update: (user) => !!user,
			delete: (user) => !!user,
			...global.access
		}
	};
};
