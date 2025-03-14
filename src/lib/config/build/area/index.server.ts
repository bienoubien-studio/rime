import type { BuiltArea, Area } from 'rizom/types';
import { findTitleField } from '../fields/findTitle.js';

export const buildArea = (area: Area<any>): BuiltArea => {
	const fieldTitle = findTitleField(area.fields);

	return {
		...area,
		asTitle: fieldTitle ? fieldTitle.name : 'id',
		type: 'area'
	} as BuiltArea;
};
