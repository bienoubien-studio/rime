import { collection } from '$rizom/config';
import { fields } from './fields.js';

export const label = {
	singular: 'Page',
	plural: 'Pages',
	gender: 'f'
};

export const panel = {
	group: 'content',
	description: 'Edit and create your website pages'
};

export const nested = true;
export const live = true;
export const icon = 'Newspaper'; // Would be imported component

export default collection('pages', {
	label,
	panel,
	fields,
	nested,
	live,
	icon
});
