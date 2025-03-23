import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import validate from '../util/validate.js';
import type { User } from 'rizom/types/auth.js';
import type { CollectionSlug, PrototypeSlug } from 'rizom/types/doc.js';
import { betterAuth as initBetterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';
import { RizomError, RizomFormError } from 'rizom/errors/index.js';
import type { RequestEvent } from '@sveltejs/kit';
import rizom from 'rizom/rizom.server.js';

const dev = process.env.NODE_ENV === 'development';

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
			enabled: true,
			sendResetPassword: async ({ user, url, token }, request) => {
				await rizom.plugins.mailer.sendMail({
					to: user.email,
					subject: 'Reset your password',
					text: `Click the link to reset your password: ${url}`
				});
			}
		}
	});

	// Create the first user at init
	// Should run only once as /api/init or /init
	// return a 404 if a user exists

	const createFirstUser = async ({ name, email, password }: CreateFirstUserArgs) => {
		const users = await getAuthUsers();

		if (users.length || !dev) {
			throw new RizomError(RizomError.NOT_FOUND);
		}

		const authUserId = await createAuthUser({
			name,
			email,
			password,
			slug: 'users'
		});

		// manually set better-auth user role as it's not working
		// with signUpEmail
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

	const createAuthUser = async ({ slug, email, password, name }: CreateAuthUserArgs) => {
		const { user } = await betterAuth.api.signUpEmail({
			body: {
				email,
				password,
				name,
				table: slug
			}
		});
		return user.id;
	};

	type DeleteAuthUserByIdArgs = { id: string; headers?: Request['headers'] };
	const deleteAuthUserById = async ({ id, headers }: DeleteAuthUserByIdArgs) => {
		await betterAuth.api.removeUser({
			body: {
				userId: id
			},
			headers
		});
		return id;
	};

	type SetBetterAuthRoleArgs = {
		roles: string[];
		userId: string;
		slug: CollectionSlug;
		headers: RequestEvent['request']['headers'];
	};
	const setAuthUserRole = async ({ roles, userId, slug, headers }: SetBetterAuthRoleArgs) => {
		//
		const authUserId = await getAuthUserId({
			slug,
			id: userId
		});

		if (!authUserId) {
			throw new RizomError('user not found');
		}

		const hasAdminRole = roles.includes('admin');

		await betterAuth.api.setRole({
			body: { userId: authUserId, role: hasAdminRole ? 'admin' : 'user' },
			headers
		});
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
			throw new RizomFormError({ email: RizomFormError.REQUIRED_FIELD });
		}
		if (!password) {
			throw new RizomFormError({ password: RizomFormError.REQUIRED_FIELD });
		}

		const isValidEmail = validate.email(email);
		if (typeof isValidEmail === 'string') {
			throw new RizomFormError({ email: RizomFormError.INVALID_FIELD });
		}

		const userTable = rizom.adapter.tables[slug];

		//@ts-expect-error will fix it
		const user = await db.query[slug].findFirst({
			where: eq(userTable.email, email)
		});

		/**
		 * Fake check when email not found
		 */
		if (!user) {
			await new Promise((resolve) => setTimeout(resolve, 30 + 20 * Math.random()));
			throw new RizomFormError({
				_form: RizomFormError.INVALID_CREDENTIALS,
				email: RizomFormError.INVALID_CREDENTIALS,
				password: RizomFormError.INVALID_CREDENTIALS
			});
		}

		/**
		 * Handle banned user
		 * trying to connect
		 */
		if (user.locked) {
			const timeLocked = parseInt(process.env.RIZOM_BANNED_TIME_MN || '60'); // min
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
				throw new RizomError(RizomError.USER_BANNED);
			}
		}

		/**
		 * Handle SignIn
		 */
		const signin = await betterAuth.api.signInEmail({
			body: {
				email,
				password
			},
			asResponse: true
		});

		const authenticated = signin && signin.status === 200;

		if (!authenticated) {
			// Check for number of tries
			const maxLoginAttempts = 5;
			const maxLoginAttemptsReached = user.loginAttempts + 1 >= maxLoginAttempts;
			// If too many tries
			if (maxLoginAttemptsReached) {
				// Ban user
				await db
					.update(userTable)
					.set({
						locked: true,
						lockedAt: new Date(),
						loginAttempts: user.loginAttempts + 1
					})
					.where(eq(userTable.id, user.id));

				throw new RizomError(RizomError.USER_BANNED);
			} else {
				// update login attempts
				await db
					.update(userTable)
					.set({
						loginAttempts: user.loginAttempts + 1
					})
					.where(eq(userTable.id, user.id));
			}

			throw new RizomFormError({
				_form: RizomFormError.INVALID_CREDENTIALS,
				email: RizomFormError.INVALID_CREDENTIALS,
				password: RizomFormError.INVALID_CREDENTIALS
			});
		} else {
			// Reset login attempts
			await db
				.update(userTable)
				.set({
					locked: false,
					loginAttempts: 0
				})
				.where(eq(userTable.id, user.id));
		}

		return {
			token: signin.headers.get('set-auth-token') as string,
			user: {
				name: user.name,
				email: user.email,
				id: user.id,
				roles: user.roles
			},
			response: signin
		};
	};

	return {
		betterAuth,
		getAuthUsers,
		getAuthUserId,
		createAuthUser,
		deleteAuthUserById,
		getUserAttributes,
		createFirstUser,
		setAuthUserRole,
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
};
