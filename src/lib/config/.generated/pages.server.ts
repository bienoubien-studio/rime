/** auto-generated */
import { collection } from '$rizom/core';

import { hooks } from '../collections/pages/hooks.server.js';
import { url } from '../collections/pages/url.server.js';

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
export const icon = 'Newspaper';
export const fields = [];

export const access = collection.access({
	read: () => true,
	create: (user) => !!user?.roles?.includes('admin'),
	update: (user) => !!user?.roles?.some((role) => ['admin', 'editor'].includes(role)),
	delete: (user) => !!user?.roles?.includes('admin')
});

export default collection.config('pages', {
	label,
	panel,
	nested,
	live,
	icon,
	fields,
	access,
	hooks,
	url
});
