export type User = {
	id: string;
	name: string;
	email: string;
	roles: string[];
};

type AccessOptions = { id?: string };
export type Access = {
	create?: (user?: User, options: AccessOptions) => boolean;
	read?: (user?: User, options: AccessOptions) => boolean;
	update?: (user?: User, options: AccessOptions) => boolean;
	delete?: (user?: User, options: AccessOptions) => boolean;
};
