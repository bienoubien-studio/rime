import type { BuiltArea, Area } from '$lib/types/config.js';
import { findTitleField } from '../fields/findTitle.js';

export const buildArea = (area: Area<any>): BuiltArea => {
	const fieldTitle = findTitleField(area.fields);

	return {
		...area,
		asTitle: fieldTitle ? fieldTitle.path : 'id',
		type: 'area'
	} as BuiltArea;
};
