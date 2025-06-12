import { UsersRound } from '@lucide/svelte';
import { access } from '$lib/util/access/index.js';
import { usersFields } from './usersFields.js';
import { collection } from '$lib/core/collections/config/builder.js';
import { PANEL_USERS } from '$lib/core/constant.js';

export const panelUsersCollection = collection(PANEL_USERS, {
	label: { singular: 'User', plural: 'Users', gender: 'm' },
	panel: {
		description: 'Manage who can access your admin panel',
		group: 'system'
	},
	auth: true,
	icon: UsersRound,
	fields: [usersFields.name, usersFields.email, usersFields.roles],
	access: {
		read: (user) => !!user,
		create: (user) => access.isAdmin(user),
		delete: (user) => access.isAdmin(user),
		update: (user, { id }) => access.isAdminOrMe(user, id)
	}
});
