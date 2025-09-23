import { accessControl, admin, staff, user } from '$lib/core/collections/auth/better-auth-permissions.js';
import type { ConfigInterface } from '$lib/core/config/interface.server.js';
import type { CorePlugins } from '$lib/core/types/plugins.js';
import type { GetRegisterType } from '$lib/index.js';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin as adminPlugin, apiKey, magicLink } from 'better-auth/plugins';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { betterAuthAfterHook, betterAuthBeforeHook } from './better-auth-hooks.server.js';

type Args = {
	db: BetterSQLite3Database<GetRegisterType<'Schema'>>;
	schema: GetRegisterType<'Schema'>;
	configInterface: ConfigInterface;
};

export const configureBetterAuth = ({ db, schema, configInterface }: Args) => {
	const mailer = configInterface.plugins.mailer as CorePlugins['mailer'];

	return betterAuth({
		plugins: configurePlugins(configInterface),
		rateLimit: {
			enabled: true,
			window: 10,
			max: 30
		},
		trustedOrigins: configInterface.raw.$trustedOrigins,
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
				type: {
					type: 'string',
					required: true
				}
			}
		},
		hooks: {
			before: betterAuthBeforeHook,
			after: betterAuthAfterHook
		},
		emailAndPassword: {
			enabled: true,
			sendResetPassword: async ({ user, url }) => {
				await mailer.sendMail({
					to: user.email,
					subject: 'Reset your password',
					text: `Click the link to reset your password: ${url}`
				});
			}
		}
	});
};

const configurePlugins = (configInterface: ConfigInterface) => {
	const mailer = configInterface.plugins.mailer as CorePlugins['mailer'];

	const HAS_MAGIC_LINK = Boolean(configInterface.raw.auth?.magicLink);
	const HAS_API_KEY = configInterface.collections.filter((c) => c.auth?.type === 'apiKey').length;

	return [
		adminPlugin({
			accessControl,
			roles: {
				admin,
				user,
				staff
			}
		}),
		apiKey({
			defaultKeyLength: 48,
			enableMetadata: true,
			permissions: {
				defaultPermissions: {
					roles: HAS_API_KEY ? ['user'] : ['none']
				}
			}
		}),
		magicLink({
			sendMagicLink: ({ email, url }) => {
				if (!HAS_MAGIC_LINK) {
					return;
				}
				mailer.sendMail({
					to: email,
					subject: 'Rizom signin link',
					text: `click this link to signin ${url}`
				});
			}
		})
	];
};
