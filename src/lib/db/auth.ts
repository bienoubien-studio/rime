// import schema, { tables, type GenericTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import crypto from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { hash, verifyHash } from 'rizom/collection/auth/utils.server.js';
import { RizomInitError } from '../errors/init.server.js';
import {
	RizomLoginEmailError,
	RizomLoginError,
	RizomLoginLockedError,
	RizomLoginPasswordError
} from '../errors/login.server.js';
import validate from '../utils/validate.js';
import { rizom } from '$lib/index.js';
import type { User } from 'rizom/types/auth.js';
import type { CollectionSlug, PrototypeSlug } from 'rizom/types/doc.js';

const createAdapterAuthInterface = (args: CreateAuthDatabaseInterfaceArgs) => {
	const { db, sessionsTable, authUsersTable } = args;

	const drizzleAdapter = new DrizzleSQLiteAdapter(db, sessionsTable, authUsersTable);
	const lucia = new Lucia(drizzleAdapter, {
		sessionCookie: {
			attributes: {
				secure: !dev
			}
		},
		getUserAttributes: (attributes) => {
			return {
				id: attributes.id,
				table: attributes.table
			};
		}
	});

	const createFirstUser = async ({ name, email, password }: CreateFirstUserArgs) => {
		const users = await getAuthUsers();
		if (users.length) {
			throw new RizomInitError('Already initialized');
		}
		const hashedPassword = await hash(password);
		const authUserId = await createAuthUser('users');
		const now = new Date();
		const values = {
			name,
			email,
			hashedPassword,
			roles: ['admin'],
			authUserId,
			createdAt: now,
			updatedAt: now
		};

		const [user] = (await db
			.insert(rizom.adapter.tables.users)
			.values(values)
			.returning()) as any[];
		return user.id;
	};

	const getAuthUsers = () => {
		//@ts-expect-error authUsers exists
		return db.query.authUsers.findMany();
	};

	const createSession = async (authUserId: string) => {
		return await lucia.createSession(authUserId, {});
	};

	const createAuthUser = async (slug: CollectionSlug) => {
		const id = crypto.randomUUID();
		await db.insert(authUsersTable).values({ id, table: slug });
		return id;
	};

	const createForgotPasswordToken = async (userTableName: PrototypeSlug, id: string | null) => {
		const table = rizom.adapter.tables[userTableName];
		const now = new Date();
		const token = crypto.randomBytes(32).toString('hex');
		const hashedToken = await hash(token);
		if (id) {
			await db
				.update(table)
				.set({
					resetToken: hashedToken,
					resetTokenExpireAt: new Date(now.getTime() + 10 * 60000)
				})
				.where(eq(table.id, id));
		}
		return token;
	};

	const verifyForgotPasswordToken = async ({
		token,
		userTableName,
		id
	}: VerifyForgotPasswordTokenArgs) => {
		let user;
		const table = rizom.adapter.tables[userTableName];
		const now = new Date();

		const users = await db
			.select({
				hashedToken: table.resetToken,
				resetTokenExpireAt: table.resetTokenExpireAt
			})
			.from(table)
			.where(eq(table.id, id));

		if (!users.length) {
			return false;
		} else {
			user = users[0];
		}

		if (!dev && now.getTime() > user.resetTokenExpireAt.getTime()) {
			return false;
		}

		return await verifyHash({ hash: user.hashedToken, clear: token });
	};

	const deleteAuthUserById = async (id: string) => {
		await db.delete(authUsersTable).where(eq(authUsersTable.id, id));
		return id;
	};

	const getUserAttributes = async ({
		authUserId,
		slug
	}: GetUserAttributesArgs): Promise<User | undefined> => {
		const table = rizom.adapter.tables[slug];
		const [user] = await db
			.select({
				id: table.id,
				name: table.name,
				roles: table.roles,
				email: table.email
			})
			.from(table)
			.where(eq(table.authUserId, authUserId));
		if (!user) return undefined;
		return user as User;
	};

	const getPanelUserAttributes = async (authUserId: string) => {
		return getUserAttributes({
			slug: 'users',
			authUserId
		});
	};

	const login = async ({ email, password, slug }: LoginArgs) => {
		//
		if (!email) {
			throw new RizomLoginEmailError('Email is required');
		}
		if (!password) {
			throw new RizomLoginPasswordError('Password is required');
		}

		const isValidEmail = validate.email(email);
		if (typeof isValidEmail === 'string') {
			throw new RizomLoginEmailError(isValidEmail);
		}

		const userTable = rizom.adapter.tables[slug];

		// @ts-expect-error todo...
		const user = await db.query[slug].findFirst({
			where: eq(userTable.email, email)
		});

		if (!user) {
			// fake check
			await verifyHash({ hash: '$argon2idfooo', clear: 'fooo' });
			throw new RizomLoginError('Invalid credentials');
		}

		if (user.locked) {
			const timeLocked = 5; // min
			const now = new Date();
			const diff = (now.getTime() - user.lockedAt.getTime()) / 60000;
			if (diff >= timeLocked) {
				await db
					.update(userTable)
					.set({
						locked: false,
						loginAttempts: 0
					})
					.where(eq(userTable.id, user.id));
				user.loginAttempts = 0;
				user.locked = false;
			} else {
				throw new RizomLoginLockedError();
			}
		}

		const validPassword = await verifyHash({ hash: user.hashedPassword, clear: password });
		if (validPassword) {
			await db
				.update(userTable)
				.set({
					locked: false,
					loginAttempts: 0
				})
				.where(eq(userTable.id, user.id));

			const session = await createSession(user.authUserId);
			return {
				session,
				user: {
					name: user.name,
					email: user.email,
					id: user.id,
					roles: user.roles
				}
			};
		} else {
			const maxLoginAttempts = 5;
			const maxLoginAttemptsReached = user.loginAttempts + 1 >= maxLoginAttempts;
			if (maxLoginAttemptsReached) {
				await db
					.update(userTable)
					.set({
						locked: true,
						lockedAt: new Date(),
						loginAttempts: user.loginAttempts + 1
					})
					.where(eq(userTable.id, user.id));

				throw new RizomLoginLockedError();
			} else {
				await db
					.update(userTable)
					.set({
						loginAttempts: user.loginAttempts + 1
					})
					.where(eq(userTable.id, user.id));
			}
			throw new RizomLoginError('Invalid credentials');
		}
	};

	return {
		lucia,
		getAuthUsers,
		createSession,
		createAuthUser,
		deleteAuthUserById,
		getUserAttributes,
		createForgotPasswordToken,
		verifyForgotPasswordToken,
		createFirstUser,
		getPanelUserAttributes,
		login
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
	slug: PrototypeSlug;
};

type VerifyForgotPasswordTokenArgs = {
	userTableName: string;
	id: string;
	token: string;
};

type CreateAuthDatabaseInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	sessionsTable: any;
	authUsersTable: any;
};

type CreateFirstUserArgs = {
	name: string;
	email: string;
	password: string;
};

declare module 'lucia' {
	interface Register {
		Lucia: ReturnType<typeof createAdapterAuthInterface>['lucia'];
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	id: string;
	table: PrototypeSlug;
}
