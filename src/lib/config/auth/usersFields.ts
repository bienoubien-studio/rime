import { validate } from 'rizom/util/index.js';
import { access } from 'rizom/util/access/index.js';
import { email, select, text } from 'rizom/fields';

const emailField = email('email')
	.access({
		read: (user) => !!user,
		update: () => false
	})
	.required()
	.unique();

const name = text('name')
	.access({
		create: (user) => !!user,
		read: () => true,
		update: () => false
	})
	.required();

const roles = select('roles')
	.options({ value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' })
	.many()
	.defaultValue('user')
	.required()
	.access({
		create: (user) => !!user && access.isAdmin(user),
		read: (user) => !!user && access.isAdmin(user),
		update: (user) => !!user && access.isAdmin(user)
	});

const password = text('password')
	.required()
	.access({
		create: (user) => !!user && access.isAdmin(user),
		read: () => false,
		update: () => false
	})
	.validate((value) => validate.password(value));

const confirmPassword = text('confirmPassword')
	.label('Confirm password')
	.required()
	.validate((value, metas) => {
		if (metas.data.password !== value) {
			return 'Password mismatch';
		}
		return true;
	});

export const usersFields = {
	email: emailField,
	name,
	roles,
	password,
	confirmPassword
};
