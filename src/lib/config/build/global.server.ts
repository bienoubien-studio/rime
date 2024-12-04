import type { AnyField, BuiltGlobalConfig, GlobalConfig } from 'rizom/types';

import { findTitleField } from './fields/findTitle.server';
import type { PrototypeSlug } from 'rizom/types/doc';
import { capitalize } from 'rizom/utils/string';
import { compileField } from 'rizom/fields/compile';
import { date, relation } from 'rizom/fields';

export const buildGlobal = (global: GlobalConfig): BuiltGlobalConfig => {
	const fields: AnyField[] = global.fields.map(compileField);

	const fieldTitle = findTitleField(fields);
	fields.push(relation('_editedBy').to('users').hidden().toField());
	fields.push(date('updatedAt').hidden().toField());

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
