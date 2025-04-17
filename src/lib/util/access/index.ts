import type { User } from '$lib/types/auth';

export const isAdmin = (user?: User) => !!user && hasRoles(user, 'admin');

export const hasRoles = (user?: User, ...roles: string[]) =>
	!!user && user.roles.some((role) => roles.includes(role));

export const isAdminOrMe = (user?: User, id?: string) => {
	return isAdmin(user) || user?.id === id;
};

export const isMe = (user?: User, id?: string) => {
	return !!(user && id === user.id);
};

export const access = { isAdmin, hasRoles, isAdminOrMe, isMe };

export default { isAdmin, hasRoles, isAdminOrMe, isMe };
