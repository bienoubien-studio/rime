import { UsersRound } from '@lucide/svelte';
import { access } from 'rizom/util/access/index.js';
import { usersFields } from './usersFields.js';
import { collection } from 'rizom/config/build/collection/builder.js';
import { PANEL_USERS } from 'rizom/constant.js';

export const panelUsersCollection = collection(PANEL_USERS, {
	label: { singular: 'User', plural: 'Users', gender: 'm' },
	auth: true,
	icon: UsersRound,
	fields: [usersFields.name, usersFields.email, usersFields.roles],
	group: 'system',
	access: {
		read: (user) => !!user,
		create: (user) => access.isAdmin(user),
		delete: (user) => access.isAdmin(user),
		update: (user, { id }) => access.isAdminOrMe(user, id)
	}
});
