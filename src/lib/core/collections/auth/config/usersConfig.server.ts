import { UsersRound } from '@lucide/svelte';
import { access } from '$lib/util/access/index.js';
import { usersFields } from './usersFields.js';
import { collection } from '$lib/core/collections/config/builder.js';
import { PANEL_USERS } from '$lib/core/constant.js';
import type { PanelUsersConfig } from '../../../../types.js';
import { FormFieldBuilder } from '$lib/fields/builders/field.js';

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

export const mergePanelUsersCollectionWithDefault = ({
	roles,
	fields,
	access,
	panel,
	label
}: PanelUsersConfig = {}) => {
	const collection = { ...panelUsersCollection };

	if (roles) {
		const hasAdminRole = roles.find((role) => role.value === 'admin');
		const otherRoles = roles.filter((role) => role.value !== 'admin');

		if (!hasAdminRole) {
			roles = [{ value: 'admin' }, ...roles];
		}

		if (otherRoles.length === 0) {
			roles.push({ value: 'user' });
		}

		const defaultRole = roles.filter((role) => role.value !== 'admin')[0].value;

		const roleField = usersFields.roles.options(...roles).defaultValue(defaultRole);

		collection.fields = [
			...collection.fields
				.filter((field) => field instanceof FormFieldBuilder)
				.filter((field) => field.raw.name !== 'roles'),
			roleField
		];
	}
	if (fields) {
		collection.fields.push(...fields);
	}
	if (access) {
		collection.access = {
			...collection.access,
			...access
		};
	}
	if (panel?.group) {
		collection.panel = { ...collection.panel, group: panel?.group };
	}
	if (label) {
		collection.label = label;
	}

	return collection;
};
