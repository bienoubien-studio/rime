import type { RequestEvent } from "@sveltejs/kit";

export type User = {
	id: string;
	name: string;
	email: string;
	roles: string[];
	isSuperAdmin?: boolean;
};

type AccessOptions = { id?: string, event: RequestEvent };

export type Access = {
	create?: (user?: User, options: AccessOptions) => boolean;
	read?: (user?: User, options: AccessOptions) => boolean;
	update?: (user?: User, options: AccessOptions) => boolean;
	delete?: (user?: User, options: AccessOptions) => boolean;
};
