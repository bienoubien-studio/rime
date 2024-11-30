import type { AnyField, BuiltGlobalConfig, GlobalConfig } from 'rizom/types';

import { findTitleField } from './fields/findTitle.server';
import type { PrototypeSlug } from 'rizom/types/doc';
import { capitalize } from 'rizom/utils/string';
import { compileField } from 'rizom/fields/compile';

export const buildGlobal = (global: GlobalConfig): BuiltGlobalConfig => {
	const fields: AnyField[] = [
		...global.fields.map(compileField),
		{ name: 'updatedAt', type: 'date', hidden: true }
	];

	const fieldTitle = findTitleField(fields);

	return {
		...global,
		slug: global.slug as PrototypeSlug,
		type: 'global',
		label: global.label ? global.label : capitalize(global.slug),
		asTitle: fieldTitle ? fieldTitle.name : 'id',
		fields,
		access: {
			create: (user) => !!user,
			read: (user) => !!user,
			update: (user) => !!user,
			delete: (user) => !!user,
			...global.access
		}
	};
};
