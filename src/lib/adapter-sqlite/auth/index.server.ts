import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { User } from '$lib/core/collections/auth/types.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import type { Dic } from '$lib/util/types.js';
import { PANEL_USERS } from '$lib/core/collections/auth/constant.server.js';
import type { ConfigInterface } from '$lib/core/config/index.server.js';
import { configureBetterAuth } from './better-auth.server.js';
import type { GetRegisterType } from 'rizom';
import type { GenericTable } from '../types.js';

/**
 * Creates and configures the authentication interface for the SQLite adapter
 * @param args Configuration parameters for the auth interface
 * @returns Object containing all auth-related functions
 */
const createAdapterAuthInterface = (args: AuthDatabaseInterfaceArgs) => {
	const { db, schema, configInterface } = args;

	const betterAuth = configureBetterAuth({ db, schema, configInterface });
	
	const getTable = (name:string) => schema[name as keyof typeof schema] as unknown as GenericTable

	const isSuperAdmin = async (userId: string) => {
		const panelUsersTable = getTable(PANEL_USERS);
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
	const getAuthUserId = async ({ slug, id }: { slug: CollectionSlug; id: string }) => {
		const userTable = getTable(slug);
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
		const table = getTable(slug);

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


type GetUserAttributesArgs = {
	authUserId: string;
	slug: CollectionSlug;
};

type AuthDatabaseInterfaceArgs = {
	db: BetterSQLite3Database<GetRegisterType<'Schema'>>;
	schema: GetRegisterType<'Schema'>;
	configInterface: ConfigInterface;
};
