import { UsersRound } from 'lucide-svelte';
import { access } from '../access/index.js';
import { usersFields } from './usersFields.js';

import type { TextField } from 'rizom/types/fields.js';
import type { CollectionConfig } from 'rizom';

export const hashedPassword: TextField = {
	name: 'hashedPassword',
	type: 'text',
	required: true,
	hidden: true
};

export const panelUsersCollection: CollectionConfig = {
	slug: 'users',
	label: { singular: 'User', plural: 'Users' },
	auth: true,
	icon: UsersRound,
	fields: [usersFields.name, usersFields.email, usersFields.roles, hashedPassword],
	access: {
		read: (user) => !!user,
		create: (user) => access.isAdmin(user),
		delete: (user) => access.isAdmin(user),
		update: (user, { id }) => access.isAdminOrMyself(user, id)
	}
};

export const privateFieldNames = [
	'password',
	'hashedPassword',
	'token',
	'resetToken',
	'resetTokenExpireAt',
	'loginAttempts',
	'locked',
	'lockedAt'
];
