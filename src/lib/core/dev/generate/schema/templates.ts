import dedent from 'dedent';
import { PANEL_USERS } from '$lib/core/constant';
import { toSnakeCase } from '$lib/util/string.js';
const s = toSnakeCase;

/**
 * Generates the standard imports needed for Drizzle ORM schema definitions
 * Includes SQLite table definitions, relations, and a primary key helper function
 */
export const templateImports = `
import { text, integer, sqliteTable, real } from "drizzle-orm/sqlite-core";
import { relations, type ColumnBaseConfig, type ColumnDataType } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';

const pk = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
`;

/**
 * Generates a basic table definition with a primary key
 * Takes a table name and optional content for additional columns
 *
 * @example
 * ```typescript
 * export const pages = sqliteTable('pages', {
 *   id: pk(),
 *   title: text('title'),
 *   content: text('content')
 * })
 * ```
 */
export const templateTable = (table: string, content: string): string => `
export const ${table} = sqliteTable( '${s(table)}', {
  id: pk(),
  ${content}
})
`;

/**
 * Generates a locale field for internationalized tables
 *
 * @example
 * ```typescript
 * locale: text("locale"),
 * ```
 */
export const templateLocale = () => 'locale: text("locale"),';

/**
 * Generates an owner reference field for parent-child relationships
 * Creates a foreign key that references the parent table's id with cascade delete
 *
 * @example
 * ```typescript
 * ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
 * ```
 */
export const templateParent = (parent: string) => {
	return `ownerId: text("owner_id").references(() => ${parent}.id, { onDelete: 'cascade' }),`;
};

/**
 * Generates authentication-related fields for a table
 * Includes login attempts, locked status, and user references
 * Adds super admin flag for the panel users table
 *
 * @example
 * ```typescript
 * loginAttempts: integer("login_attempts").notNull().default(0),
 * locked: integer("locked", { mode: 'boolean'}).notNull().default(false),
 * lockedAt: integer("locked_at", { mode: 'timestamp'}),
 * authUserId: text("auth_user_id").references(() => authUsers.id).notNull(),
 * ```
 */
export const templateHasAuth = (slug: string) => {
	return `loginAttempts: integer("login_attempts").notNull().default(0),
locked: integer("locked", { mode: 'boolean'}).notNull().default(false),
lockedAt: integer("locked_at", { mode: 'timestamp'}),
authUserId: text("auth_user_id").references(() => authUsers.id).notNull(),
${slug === PANEL_USERS ? `isSuperAdmin: integer('is_super_admin', { mode: 'boolean' }),` : ''}
`;
};

/**
 * Generates unique and required modifiers for a field
 * Combines .unique() and .notNull() based on field configuration
 *
 * @example
 * ```typescript
 * // For a unique and required field:
 * .unique().notNull()
 *
 * // For just a unique field:
 * .unique()
 *
 * // For just a required field:
 * .notNull()
 * ```
 */
export const templateUniqueRequired = (field: { unique?: boolean; required?: boolean }) => {
	const { unique, required } = field;
	return `${unique ? '.unique()' : ''}${required ? '.notNull()' : ''}`;
};

/** Template rows Relation */

/**
 * Generates a one-to-one or many-to-one relationship definition
 * Creates a relation where the table has one parent
 *
 * @example
 * ```typescript
 * export const rel_pagesVersionsHasOnePages = relations(pagesVersions, ({ one }) => ({
 *   pages: one(pages, {
 *     fields: [pagesVersions.ownerId],
 *     references: [pages.id],
 *   }),
 * }))
 * ```
 */
export const templateRelationOne = ({ name, table, parent }: RelationOneArgs): string => `
export const ${name} = relations(${table}, ({ one }) => ({
  ${parent} : one(${parent}, {
    fields: [${table}.ownerId],
    references: [${parent}.id],
  }),
}))
`;

/**
 * Generates a one-to-many relationship definition
 * Creates a relation where the table has many children
 *
 * @example
 * ```typescript
 * export const rel_pagesHasManyBlocks = relations(pages, ({ many }) => ({
 *   pagesBlocksParagraph: many(pagesBlocksParagraph),
 *   pagesBlocksImage: many(pagesBlocksImage),
 * }))
 * ```
 */
export const templateRelationMany = ({ name, table, many }: RelationManyArgs): string => `
export const ${name} = relations(${table}, ({ many }) => ({
  ${many.map((child) => `${child}: many(${child}),`).join('\n')}
}))
`;

/** Templates Field Relations */

/**
 * Generates a foreign key column for a relation field
 * Creates a reference to another table's primary key with cascade delete
 *
 * @example
 * ```typescript
 * mediasId: text('medias_id').references(() => medias.id, { onDelete: 'cascade' })
 * ```
 */
export const templateFieldRelationColumn = (table: string) => {
	return `${table}Id:  text('${s(table)}_id').references(() => ${table}.id, { onDelete: 'cascade' })`;
};

/**
 * Generates a junction table for many-to-many relationships
 * Creates a table with references to the owner table and related tables
 * Includes path and position fields for ordering relationships
 *
 * @example
 * ```typescript
 * export const pagesRels = sqliteTable('pages_rels', {
 *   id: pk(),
 *   path: text('path'),
 *   position: integer('position'),
 *   ownerId: text('owner_id').references(() => pages.id, { onDelete: 'cascade' }),
 *   mediasId: text('medias_id').references(() => medias.id, { onDelete: 'cascade' }),
 *   locale: text('locale'),
 * })
 * ```
 */
export const templateRelationFieldsTable = ({
	table,
	relations,
	hasLocale
}: FieldsRelationTableArgs) => `
export const ${table}Rels = sqliteTable('${s(table)}_rels', {
  id: pk(),
  path: text('path'),
  position: integer('position'),
  ${templateParent(table)}
  ${relations.map((rel) => templateFieldRelationColumn(rel)).join(',\n')},
  ${hasLocale ? `locale: text('locale'),` : ''}
})
`;

/**
 * Generates an export of relation field mappings for runtime use
 * Creates a record mapping table names to their relation configurations
 *
 * @example
 * ```typescript
 * export const relationFieldsMap: Record<string, any> = {
 *   pages: {"medias":{"to":"medias"},"categories":{"to":"categories"}}
 * }
 * ```
 */
export const templateExportRelationsFieldsToTable = (relationFieldsDic: Record<string, string>) => {
	const content = [];
	for (const [table, dic] of Object.entries(relationFieldsDic)) {
		content.push(dedent`
      ${table} : ${JSON.stringify(dic)}
    `);
	}
	return dedent`
    export const relationFieldsMap: Record<string, any> = {
      ${content.join(',\n      ')}
    }
  `;
};

/**
 * Generates an export of all tables for runtime use
 * Creates a record with all table definitions and proper TypeScript types
 *
 * @example
 * ```typescript
 * export const tables: Tables = {
 *   pages,
 *   pagesBlocksParagraph,
 *   pagesBlocksImage,
 *   authUsers,
 *   authAccounts,
 *   authVerifications,
 *   authSessions
 * }
 * ```
 */
export const templateExportTables = (tables: string[]): string => dedent`

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
    ${tables.join(',\n    ')},
    authUsers,
    authAccounts,
    authVerifications,
    authSessions
  }
`;

/**
 * Generates authentication tables for the schema
 * Creates tables for users, sessions, accounts, and verifications
 */
export const templateAuth = `
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
`;

/**
 * Generates the final schema export with all tables and relations
 * Creates a schema object and exports it with proper TypeScript types
 *
 * @example
 * ```typescript
 * const schema = {
 *   pages,
 *   pagesVersions,
 *   rel_pagesVersionsHasOnePages,
 *   rel_pagesHasManyVersions,
 *   authUsers,
 *   authAccounts,
 *   authVerifications,
 *   authSessions
 * }
 *
 * export type Schema = typeof schema
 * export default schema
 * ```
 */
export const templateExportSchema = ({ enumTables, enumRelations }: TemplateExportSchemaArgs) => `
   const schema = {
     ${enumTables.join(',\n      ')},
     ${enumRelations.length ? enumRelations.join(',\n      ') + ',' : ''}
     authUsers,
     authAccounts,
     authVerifications,
     authSessions
 }

 export type Schema = typeof schema
 export default schema
 `;

/**
 * Generates a section header for a collection or area in the schema
 * Creates a visual separator with the slug name
 */
export const templateHead = (slug: string) => dedent`
  /** ${slug} ============================================== **/`;

type RelationOneArgs = {
	name: string;
	table: string;
	parent: string;
};
type RelationManyArgs = {
	name: string;
	table: string;
	many: string[];
};
type FieldsRelationTableArgs = {
	table: string;
	relations: string[];
	hasLocale?: boolean;
};
type TemplateExportSchemaArgs = { enumTables: string[]; enumRelations: string[] };
