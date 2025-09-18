import { access } from '$lib/util/access/index.js';

export const accessConfig = {
	read: () => true,
	create: (user) => access.isAdmin(user),
	update: (user) => access.hasRoles(user, 'admin', 'editor'),
	delete: (user) => access.isAdmin(user)
};

export const url = (doc) =>
	doc.attributes.isHome
		? `${process.env.PUBLIC_RIZOM_URL}/`
		: `${process.env.PUBLIC_RIZOM_URL}/[...parent.attributes.slug]/${doc.attributes.slug}`;
