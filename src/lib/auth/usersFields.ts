import { validate } from 'rizom/utils/index.js';
import { access } from 'rizom/access/index.js';
import type { EmailField, SelectField, TextField } from 'rizom/types/fields';

const email: EmailField = {
	name: 'email',
	type: 'email',
	validate: (value: string) => validate.email(value),
	hidden: true,
	required: true,
	unique: true
};

const name: TextField = {
	name: 'name',
	type: 'text',
	required: true
};

const roles: SelectField = {
	name: 'roles',
	type: 'select',
	options: [{ value: 'admin', label: 'Admin' }],
	many: true,
	defaultValue: 'admin',
	required: true,
	access: {
		create: (user) => !!user && access.isAdmin(user),
		read: (user) => !!user && access.isAdmin(user),
		update: (user) => !!user && access.isAdmin(user)
	}
};

const password: TextField = {
	type: 'text',
	name: 'password',
	required: true,
	validate: (value: string) => {
		return validate.password(value);
	}
};

const confirmPassword: TextField = {
	type: 'text',
	name: 'confirmPassword',
	label: 'Confirm password',
	required: true,
	validate: (value: string, metas) => {
		if (metas.data.password !== value) {
			return 'Password mismatch';
		}
		return true;
	}
};

export const usersFields = {
	email,
	name,
	roles,
	password,
	confirmPassword
};

type UsersFields = {
	email: typeof email;
	roles: typeof roles;
	password: typeof password;
	confirmPassword: typeof confirmPassword;
};

export type { UsersFields };
