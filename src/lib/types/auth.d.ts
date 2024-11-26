export type User = {
	id: string;
	name: string;
	email: string;
	roles: string[];
};

type AccessOptions = { id?: string };
export type Access = {
	create?: (user?: User) => boolean;
	read?: (user?: User, AccessOptions?) => boolean;
	update?: (user?: User, AccessOptions?) => boolean;
	delete?: (user?: User, AccessOptions?) => boolean;
};
