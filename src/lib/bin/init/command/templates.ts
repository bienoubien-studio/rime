import { randomId } from '$lib/util/random.js';
import dedent from 'dedent';

const PACKAGE = 'rizom';

export const env = () => `BETTER_AUTH_SECRET=${randomId(32)}
PUBLIC_RIZOM_URL=http://localhost:5173

# RIZOM_CACHE_ENABLED=false
# RIZOM_SMTP_USER=user@mail.com
# RIZOM_SMTP_PASSWORD=supersecret
# RIZOM_SMTP_HOST=smtphost.com
# RIZOM_SMTP_PORT=465
`;

export const defaultConfig = (name: string) => `
import type { Config } from '${PACKAGE}';
import { collection } from '${PACKAGE}';
import { text } from '${PACKAGE}/fields';

const Pages = collection('pages', {
	group: 'content',
	fields: [text('title').isTitle()]
});

const config: Config = {
  database: '${name}.sqlite',
  collections: [Pages],
  areas: []
};
export default config;
`;

export const drizzleConfig = (name: string) => `
import { defineConfig, type Config } from 'drizzle-kit';

export const config: Config = {
  schema: './src/lib/server/schema.ts',
  out: './db',
  strict: false,
  dialect: 'sqlite',
  dbCredentials: {
    url: './db/${name}.sqlite'
  }
};

export default defineConfig(config);
`;

export const hooks = `import { sequence } from '@sveltejs/kit/hooks';
import { handlers } from '${PACKAGE}';
import config from './config/rizom.config.js';
import * as schema from './lib/server/schema.js';

export const handle = sequence(...handlers({ config, schema }));
`;

export const auth = (name: string) => `
  import { betterAuth } from "better-auth";
  import Database from "better-sqlite3";

  export const auth = betterAuth({
      database: new Database("./db/${name}.db"),
  })`;

export const defaultSchema = dedent`

  import { text, integer, sqliteTable, real } from "drizzle-orm/sqlite-core";
  import { relations, type ColumnBaseConfig, type ColumnDataType } from 'drizzle-orm';
  import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';

  const pk = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

  /** pages ============================================== **/

  export const pages = sqliteTable( 'pages', {
    id: pk(),
    title: text('title'),
    createdAt: integer('created_at', { mode : 'timestamp' }),
    updatedAt: integer('updated_at', { mode : 'timestamp' }),
    editedBy: text('edited_by'),
  })

  /** users ============================================== **/

  export const users = sqliteTable( 'users', {
    id: pk(),
    name: text('name').notNull(),
    email: text('email').unique().notNull(),
    roles: text('roles', { mode: 'json' }),
    createdAt: integer('created_at', { mode : 'timestamp' }),
    updatedAt: integer('updated_at', { mode : 'timestamp' }),
    editedBy: text('edited_by'),

    loginAttempts: integer("login_attempts").notNull().default(0),
    locked: integer("locked", { mode: 'boolean'}).notNull().default(false),
    lockedAt: integer("locked_at", { mode: 'timestamp'}),
    authUserId: text("auth_user_id").references(() => authUsers.id).notNull(),

  })

    export const authUsers = sqliteTable('auth_users', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	role: text('role'),
	banned: integer('banned', { mode: 'boolean' }),
	banReason: text('ban_reason'),
	banExpires: integer('ban_expires', { mode: 'timestamp' }),
	table: text('table').notNull()
    });

    export const authSessions = sqliteTable('auth_sessions', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => authUsers.id),
	impersonatedBy: text('impersonated_by')
    });

    export const authAccounts = sqliteTable('auth_accounts', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => authUsers.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
    });

    export const authVerifications = sqliteTable('auth_verifications', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
    });

  type GenericColumn = SQLiteColumn<
    ColumnBaseConfig<ColumnDataType, string>,
    Record<string, unknown>
  >;
  type GenericColumns = {
    [x: string]: GenericColumn;
  };
  export type GenericTable = SQLiteTableWithColumns<{
    columns: GenericColumns;
    dialect: string;
    name: string;
    schema: undefined;
  }>;
  type Tables = Record<string, GenericTable | SQLiteTableWithColumns<any>>;

  export const tables: Tables = {
    pages,
    users,
    authUsers,
    authAccounts,
    authVerifications,
    authSessions
  }
  export const relationFieldsMap: Record<string, any> = {
    pages : {},
    users : {}
  }

     const schema = {
       pages,
        users,

       authUsers,
       authAccounts,
       authVerifications,
       authSessions
   }

   export type Schema = typeof schema
   export default schema
`;
