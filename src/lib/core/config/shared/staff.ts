import type { CollectionWithoutSlug } from '$lib/core/collections/config/types.js';
import type { Option } from '$lib/types.js';
import { access } from '$lib/util/index.js';
import { UsersRound } from '@lucide/svelte';
import cloneDeep from 'clone-deep';
import { Collection } from 'rizom:core';
import type { AdditionalStaffConfig, AuthConfig, BuiltCollection } from '../types.js';

export const staffCollection: CollectionWithoutSlug<'staff'> & { auth: AuthConfig } = {
	label: { singular: 'User', plural: 'Users' },
	panel: {
		description: 'Manage who can access your admin panel',
		group: 'system'
	},
	auth: {
		type: 'password',
		roles: ['admin', 'staff']
	},
	icon: UsersRound,
	fields: [],
	access: {
		read: (user) => access.isAdmin(user),
		create: (user) => access.isAdmin(user),
		delete: (user) => access.isAdmin(user),
		update: (user, { id }) => access.isAdminOrMe(user, id)
	}
};

export const buildStaffCollection = ({
	roles: incomingRoles = [],
	fields,
	access,
	panel,
	label
}: AdditionalStaffConfig = {}): BuiltCollection => {
	const baseStaffConfig = cloneDeep(staffCollection);
	let roles: Option[] = incomingRoles.map((role) => (typeof role === 'string' ? { value: role } : role));

	if (roles) {
		const hasAdminRole = roles.find((role) => role.value === 'admin');
		const otherRoles = roles.filter((role) => role.value !== 'admin');

		// Add admin role on Staff collection if not present
		if (!hasAdminRole) {
			roles = [{ value: 'admin' }, ...roles];
		}

		// If there is no other roles than admin add a staff role
		if (otherRoles.length === 0) {
			roles.push({ value: 'staff' });
		}

		baseStaffConfig.auth.roles = roles.map((role) => role.value);
	}

	if (fields) {
		baseStaffConfig.fields.push(...fields);
	}
	if (access) {
		baseStaffConfig.access = {
			...baseStaffConfig.access,
			...access
		};
	}
	if (panel?.group) {
		baseStaffConfig.panel = { ...baseStaffConfig.panel, group: panel?.group };
	}
	if (label) {
		baseStaffConfig.label = label;
	}

	return Collection.config('staff', baseStaffConfig);
};
