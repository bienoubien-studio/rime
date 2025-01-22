import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
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
import { betterAuth as initBetterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';
import { dev } from '$app/environment';

const createAdapterAuthInterface = (args: AuthDatabaseInterfaceArgs) => {
	const { db, schema, trustedOrigins } = args;

	const betterAuth = initBetterAuth({
		plugins: [bearer(), admin()],
		trustedOrigins,
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: {
				...schema,
				user: schema.authUsers,
				session: schema.authSessions,
				account: schema.authAccounts,
				verification: schema.authVerifications
			}
		}),
		session: {
			modelName: 'authSessions'
		},
		account: {
			modelName: 'authAccounts'
		},
		verification: {
			modelName: 'authVerifications'
		},
		user: {
			modelName: 'authUsers',
			changeEmail: {
				enabled: true
			},
			deleteUser: {
				enabled: true
			},
			additionalFields: {
				table: {
					type: 'string',
					required: true
				}
			}
		},
		emailAndPassword: {
			enabled: true
		}
	});

	// Create the first user at init
	// Should run only once as /api/init or /init
	// return a 404 if a user exists
	const createFirstUser = async ({ name, email, password }: CreateFirstUserArgs) => {
		const users = await getAuthUsers();

		if (users.length || !dev) {
			throw new RizomInitError('Already initialized');
		}

		const authUserId = await createAuthUser({
			name,
			email,
			password,
			slug: 'users',
			role: 'admin'
		});

		await db.update(schema.authUsers).set({
			role: 'admin'
		});

		const now = new Date();
		const values = {
			name,
			email,
			roles: ['admin'],
			authUserId,
			createdAt: now,
			updatedAt: now
		};

		const [user] = (await db
			.insert(rizom.adapter.tables.users)
			.values(values)
			.returning()) as User[];
		return user.id;
	};

	type GetAuthUserIdArgs = { slug: string; id: string };
	const getAuthUserId = async ({ slug, id }: GetAuthUserIdArgs) => {
		const userTable = rizom.adapter.tables[slug];
		//@ts-expect-error slug is key of query
		const user = await db.query[slug].findFirst({ where: eq(userTable.id, id) });
		if (user) {
			return user.authUserId;
		}
		return null;
	};

	const getAuthUsers = () => {
		//@ts-expect-error will fix it
		return db.query.authUsers.findMany();
	};

	const createAuthUser = async ({ slug, email, password, name, role }: CreateAuthUserArgs) => {
		console.log('createAuthUser', role);
		const { user } = await betterAuth.api.signUpEmail({
			body: {
				email,
				password,
				name,
				role: role || 'user',
				table: slug
			}
		});
		return user.id;
	};

	const createForgotPasswordToken = async (userTableName: PrototypeSlug, id: string | null) => {
		throw new Error('not implemented');
		// const table = rizom.adapter.tables[userTableName];
		// const now = new Date();
		// const token = crypto.randomBytes(32).toString('hex');
		// const hashedToken = await hash(token);
		// if (id) {
		// 	await db
		// 		.update(table)
		// 		.set({
		// 			resetToken: hashedToken,
		// 			resetTokenExpireAt: new Date(now.getTime() + 10 * 60000)
		// 		})
		// 		.where(eq(table.id, id));
		// }
		// return token;
	};

	const verifyForgotPasswordToken = async ({
		token,
		userTableName,
		id
	}: VerifyForgotPasswordTokenArgs) => {
		throw new Error('not implemented');
		// let user;
		// const table = rizom.adapter.tables[userTableName];
		// const now = new Date();

		// const users = await db
		// 	.select({
		// 		hashedToken: table.resetToken,
		// 		resetTokenExpireAt: table.resetTokenExpireAt
		// 	})
		// 	.from(table)
		// 	.where(eq(table.id, id));

		// if (!users.length) {
		// 	return false;
		// } else {
		// 	user = users[0];
		// }

		// if (!dev && now.getTime() > user.resetTokenExpireAt.getTime()) {
		// 	return false;
		// }

		// return await verifyHash({ hash: user.hashedToken, clear: token });
	};

	const deleteAuthUserById = async (id: string) => {
		await betterAuth.api.removeUser({
			body: {
				userId: id
			}
		});
		return id;
	};

	// Get auth collection attributes
	// based on an authUserId and the slug
	// of the collection
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

	// Shortcut to get panel user attributes
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

		//@ts-expect-error will fix it
		const user = await db.query[slug].findFirst({
			where: eq(userTable.email, email)
		});

		if (!user) {
			// fake check
			await new Promise((resolve) => setTimeout(resolve, 30 + 20 * Math.random()));
			throw new RizomLoginError('Invalid credentials');
		}

		if (user.locked) {
			const timeLocked = 5; // min
			const now = new Date();
			const diff = (now.getTime() - user.lockedAt.getTime()) / 60000;
			// unlock user
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

		let signin;
		try {
			signin = await betterAuth.api.signInEmail({
				body: {
					email,
					password
				},
				asResponse: true
			});
		} catch (err: any) {
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

		if (!signin || signin.status !== 200) {
			throw new RizomLoginError('Invalid credentials');
		}

		await db
			.update(userTable)
			.set({
				locked: false,
				loginAttempts: 0
			})
			.where(eq(userTable.id, user.id));

		return {
			token: signin.headers.get('set-auth-token'),
			user: {
				name: user.name,
				email: user.email,
				id: user.id,
				roles: user.roles
			}
		};
	};

	return {
		betterAuth,
		getAuthUsers,
		getAuthUserId,
		// createSession,
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

type AuthDatabaseInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	schema: any;
	trustedOrigins: string[];
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
	role: 'user' | 'admin';
};
