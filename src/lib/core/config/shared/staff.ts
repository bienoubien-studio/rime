import type { CollectionWithoutSlug } from '$lib/core/collections/config/types';
import type { Option } from '$lib/types';
import { access } from '$lib/util';
import { UsersRound } from '@lucide/svelte';
import cloneDeep from 'clone-deep';
import { Collection } from 'rizom:core';
import type { AdditionalStaffConfig, BuiltCollection } from '../types';

export const staffCollection: CollectionWithoutSlug<'staff'> = {
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
	const staff = cloneDeep(Collection.config('staff', staffCollection));
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

		if (!staff.auth || typeof staff.auth === 'boolean') {
			throw Error('predefined staff collection should have an auth:AuthConfig property, should never throw');
		}

		staff.auth.roles = roles.map((role) => role.value);
	}

	if (fields) {
		staff.fields.push(...fields);
	}
	if (access) {
		staff.access = {
			...staff.access,
			...access
		};
	}
	if (panel?.group) {
		staff.panel = { ...staff.panel, group: panel?.group };
	}
	if (label) {
		staff.label = label;
	}

	return {
		...staff
	};
};
