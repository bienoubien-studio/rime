import { collection } from '$rizom/core';
import { text } from 'rizom/fields';

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

export const fields = [text('title')];

export const access = collection.access({
	read: () => true,
	create: (user) => !!user?.roles?.includes('admin'),
	update: (user) => !!user?.roles?.some((role) => ['admin', 'editor'].includes(role)),
	delete: (user) => !!user?.roles?.includes('admin')
});
