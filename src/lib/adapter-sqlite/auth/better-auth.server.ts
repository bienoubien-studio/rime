import type { CorePlugins } from '$lib/core/types/plugins.js';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin as adminPlugin, apiKey, magicLink } from 'better-auth/plugins';
import type { AuthDatabaseInterfaceArgs } from './index.server.js';
import { accessControl, admin, user, staff } from '$lib/core/collections/auth/better-auth-permissions.js';
import { betterAuthAfterHook, betterAuthBeforeHook } from './better-auth-hooks.server.js';

export const configureBetterAuth = ({ db, schema, configInterface }: AuthDatabaseInterfaceArgs) => {
	const mailer = configInterface.get('plugins').mailer as CorePlugins['mailer'];

	return betterAuth({
		plugins: configurePlugins(configInterface),
		rateLimit: {
			enabled: true,
			window: 10,
			max: 30
		},
		trustedOrigins: configInterface.raw.trustedOrigins,
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

const configurePlugins = (configInterface: AuthDatabaseInterfaceArgs['configInterface']) => {
	const mailer = configInterface.get('plugins').mailer as CorePlugins['mailer'];

	const HAS_MAGIC_LINK = Boolean(configInterface.raw.auth?.magicLink);
	const HAS_API_KEY = configInterface.collections.filter((c) => c.auth?.type === 'apiKey').length;

	const makeAdminPlugin = () =>
		adminPlugin({
			accessControl,
			roles: {
				admin,
				user,
				staff
			}
		});

	const makeApiKeyPlugin = () =>
		apiKey({
			defaultKeyLength: 48,
			enableMetadata: true,
			permissions: {
				defaultPermissions: {
					roles: ['user']
				}
			}
		});

	// Should return separate list of plugins to preserve type inference
	if (HAS_API_KEY && HAS_MAGIC_LINK) {
		return [
			makeAdminPlugin(),

			magicLink({
				sendMagicLink: ({ email, url, token }) => {
					mailer.sendMail({
						to: email,
						subject: 'Rizom signin link',
						text: `click this link to signin ${url}`
					});
				}
			}),
			makeApiKeyPlugin()
		];
	} else if (HAS_API_KEY) {
		return [makeAdminPlugin(), makeApiKeyPlugin()];
	} else if (HAS_MAGIC_LINK) {
		return [
			makeAdminPlugin(),

			magicLink({
				sendMagicLink: ({ email, url, token }) => {
					mailer.sendMail({
						to: email,
						subject: 'Rizom signin link',
						text: `click this link to signin ${url}`
					});
				}
			})
		];
	} else {
		return [makeAdminPlugin()];
	}
};
