import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import validate from '../../util/validate.js';
import type { User } from '$lib/core/collections/auth/types.js';
import type { CollectionSlug, PrototypeSlug } from '$lib/core/types/doc.js';
import { RizomError, RizomFormError } from '$lib/core/errors/index.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { Dic } from '$lib/util/types.js';
import { BETTER_AUTH_ROLES, PANEL_USERS } from '$lib/core/collections/auth/constant.server.js';
import type { ConfigInterface } from '$lib/core/config/index.server.js';
import { configureBetterAuth } from './better-auth.server.js';

const dev = process.env.NODE_ENV === 'development';

/**
 * Creates and configures the authentication interface for the SQLite adapter
 * @param args Configuration parameters for the auth interface
 * @returns Object containing all auth-related functions
 */
const createAdapterAuthInterface = (args: AuthDatabaseInterfaceArgs) => {
	const { db, schema, configInterface } = args;

	const betterAuth = configureBetterAuth({ db, schema, configInterface });
	
	const isSuperAdmin = async (userId: string) => {
		const panelUsersTable = schema[PANEL_USERS];
		const [user] = await db
			.select({ isSuperAdmin: panelUsersTable.isSuperAdmin })
			.from(panelUsersTable)
			.where(eq(panelUsersTable.id, userId));
		if (!user) return false;
		return user.isSuperAdmin === true;
	};

	/**
	 * Retrieves the BetterAuth user ID from a collection row
	 * @returns BetterAuth user ID or null if not found
	 */
	const getAuthUserId = async ({ slug, id }: { slug: string; id: string }) => {
		const userTable = schema[slug];
		//@ts-expect-error slug is key of query
		const user = await db.query[slug].findFirst({ where: eq(userTable.id, id) });
		if (user) {
			return user.authUserId;
		}
		return null;
	};

	/**
	 * Retrieves all BetterAuth users from the database
	 * @returns Array of all auth users
	 */
	const getAuthUsers = () => {
		//@ts-expect-error will fix it
		return db.query.authUsers.findMany();
	};

	/**
	 * Deletes a BetterAuth user by ID
	 * @returns ID of the deleted user
	 */
	const deleteAuthUserById = async ({ id, headers }: { id: string; headers?: Request['headers'] }) => {
		await betterAuth.api.removeUser({
			body: {
				userId: id
			},
			headers
		});
		return id;
	};

	/**
	 * Retrieves user attributes from an auth collection
	 * @returns User object or undefined if not found
	 */
	const getUserAttributes = async ({ authUserId, slug }: GetUserAttributesArgs): Promise<User | undefined> => {
		const table = schema[slug];

		const columns: Dic = {
			id: table.id,
			name: table.name,
			roles: table.roles,
			email: table.email
		};

		if (slug === PANEL_USERS) {
			columns.isSuperAdmin = table.isSuperAdmin;
		}

		const [user] = await db.select(columns).from(table).where(eq(table.authUserId, authUserId));

		if (!user) return undefined;

		return {
			...user,
			isStaff: slug === 'staff'
		} as User;
	};
	
	return {
		betterAuth,
		getAuthUsers,
		getAuthUserId,
		deleteAuthUserById,
		getUserAttributes,
		isSuperAdmin,
	};
};

export default createAdapterAuthInterface;

type LoginArgs = {
	email?: string;
	password?: string;
	slug: PrototypeSlug;
};

type GetUserAttributesArgs = {
	authUserId: string;
	slug: CollectionSlug;
};

export type AuthDatabaseInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	schema: any;
	configInterface: ConfigInterface;
};

type CreateFirstUserArgs = {
	name: string;
	email: string;
	password: string;
};

type CreateAuthUserArgs = {
	slug: CollectionSlug;
	email: string;
	password: string;
	name: string;
};
