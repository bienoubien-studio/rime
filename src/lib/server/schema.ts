
import { text, integer, sqliteTable, real } from "drizzle-orm/sqlite-core";
import { relations, type ColumnBaseConfig, type ColumnDataType } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';

const pk = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

/** pages ============================================== **/

export const pages = sqliteTable( 'pages', {
  id: pk(),
  attributes__title: text('attributes__title').notNull(),
  attributes__isHome: integer('attributes__is_home', { mode: 'boolean' }),
  attributes__slug: text('attributes__slug'),
  attributes__summary__intro: text('attributes__summary__intro'),
  layout__hero__title: text('layout__hero__title'),
  layout__hero__intro: text('layout__hero__intro'),
  metas__title: text('metas__title'),
  metas__description: text('metas__description'),
  status: text('status'),
  nestedPosition: real('nested_position'),
  editedBy: text('edited_by'),
  createdAt: integer('created_at', { mode : 'timestamp' }),
  updatedAt: integer('updated_at', { mode : 'timestamp' }),
})

export const pagesBlocksParagraph = sqliteTable( 'pages_blocks_paragraph', {
  id: pk(),
  text: text('text'),
  type: text('type'),
  path: text('path'),
  position: real('position'),
  ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
})

export const pagesBlocksImage = sqliteTable( 'pages_blocks_image', {
  id: pk(),
  type: text('type'),
  path: text('path'),
  position: real('position'),
  ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
})

export const pagesBlocksSlider = sqliteTable( 'pages_blocks_slider', {
  id: pk(),
  type: text('type'),
  path: text('path'),
  position: real('position'),
  ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
})

export const pagesBlocksKeyFacts = sqliteTable( 'pages_blocks_key_facts', {
  id: pk(),
  type: text('type'),
  path: text('path'),
  position: real('position'),
  ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
})

export const pagesTreeFacts = sqliteTable( 'pages_tree_facts', {
  id: pk(),
  path: text('path'),
  position: real('position'),
  title: text('title'),
  description: text('description'),
  icon: text('icon', { mode: 'json' }),
  ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
})

export const pagesBlocksBlack = sqliteTable( 'pages_blocks_black', {
  id: pk(),
  title: text('title'),
  type: text('type'),
  path: text('path'),
  position: real('position'),
  ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
})

export const pagesBlocksContent = sqliteTable( 'pages_blocks_content', {
  id: pk(),
  title: text('title'),
  text: text('text'),
  type: text('type'),
  path: text('path'),
  position: real('position'),
  ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
})

export const pagesRels = sqliteTable('pages_rels', {
  id: pk(),
  path: text('path'),
  position: integer('position'),
  ownerId: text("owner_id").references(() => pages.id, { onDelete: 'cascade' }),
  mediasId:  text('medias_id').references(() => medias.id, { onDelete: 'cascade' }),
pagesId:  text('pages_id').references(() => pages.id, { onDelete: 'cascade' }),
  
})

export const rel_pagesRels = relations(pages, ({ many }) => ({
  medias: many(medias),
pages: many(pages),
}))

export const rel_pagesBlocksParagraphHasOnePages = relations(pagesBlocksParagraph, ({ one }) => ({
  pages : one(pages, {
    fields: [pagesBlocksParagraph.ownerId],
    references: [pages.id],
  }),
}))

export const rel_pagesBlocksImageHasOnePages = relations(pagesBlocksImage, ({ one }) => ({
  pages : one(pages, {
    fields: [pagesBlocksImage.ownerId],
    references: [pages.id],
  }),
}))

export const rel_pagesBlocksSliderHasOnePages = relations(pagesBlocksSlider, ({ one }) => ({
  pages : one(pages, {
    fields: [pagesBlocksSlider.ownerId],
    references: [pages.id],
  }),
}))

export const rel_pagesBlocksKeyFactsHasOnePages = relations(pagesBlocksKeyFacts, ({ one }) => ({
  pages : one(pages, {
    fields: [pagesBlocksKeyFacts.ownerId],
    references: [pages.id],
  }),
}))

export const rel_pagesTreeFactsHasOnePages = relations(pagesTreeFacts, ({ one }) => ({
  pages : one(pages, {
    fields: [pagesTreeFacts.ownerId],
    references: [pages.id],
  }),
}))

export const rel_pagesBlocksBlackHasOnePages = relations(pagesBlocksBlack, ({ one }) => ({
  pages : one(pages, {
    fields: [pagesBlocksBlack.ownerId],
    references: [pages.id],
  }),
}))

export const rel_pagesBlocksContentHasOnePages = relations(pagesBlocksContent, ({ one }) => ({
  pages : one(pages, {
    fields: [pagesBlocksContent.ownerId],
    references: [pages.id],
  }),
}))

export const rel_pagesRelsHasOnePages = relations(pagesRels, ({ one }) => ({
  pages : one(pages, {
    fields: [pagesRels.ownerId],
    references: [pages.id],
  }),
}))

export const rel_pagesHasMany = relations(pages, ({ many }) => ({
  pagesBlocksParagraph: many(pagesBlocksParagraph),
pagesBlocksImage: many(pagesBlocksImage),
pagesBlocksSlider: many(pagesBlocksSlider),
pagesBlocksKeyFacts: many(pagesBlocksKeyFacts),
pagesTreeFacts: many(pagesTreeFacts),
pagesBlocksBlack: many(pagesBlocksBlack),
pagesBlocksContent: many(pagesBlocksContent),
pagesRels: many(pagesRels),
}))

/** medias ============================================== **/

export const medias = sqliteTable( 'medias', {
  id: pk(),
  alt: text('alt').notNull(),
  thumbnail: text('thumbnail'),
  sm: text('sm'),
  md: text('md'),
  lg: text('lg'),
  xl: text('xl'),
  mimeType: text('mime_type'),
  filename: text('filename'),
  filesize: text('filesize'),
  editedBy: text('edited_by'),
  createdAt: integer('created_at', { mode : 'timestamp' }),
  updatedAt: integer('updated_at', { mode : 'timestamp' }),
})

/** news ============================================== **/

export const news = sqliteTable( 'news', {
  id: pk(),
  attributes__title: text('attributes__title').notNull(),
  attributes__slug: text('attributes__slug').notNull(),
  attributes__intro: text('attributes__intro'),
  attributes__published: integer('attributes__published', { mode : 'timestamp' }),
  writer__text: text('writer__text'),
  editedBy: text('edited_by'),
  createdAt: integer('created_at', { mode : 'timestamp' }),
  updatedAt: integer('updated_at', { mode : 'timestamp' }),
})

/** staff ============================================== **/

export const staff = sqliteTable( 'staff', {
  id: pk(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  editedBy: text('edited_by'),
  createdAt: integer('created_at', { mode : 'timestamp' }),
  updatedAt: integer('updated_at', { mode : 'timestamp' }),
  roles: text('roles', { mode: 'json' }).notNull(),
  loginAttempts: integer("login_attempts").notNull().default(0),
locked: integer("locked", { mode: 'boolean'}).notNull().default(false),
lockedAt: integer("locked_at", { mode: 'timestamp'}),
authUserId: text("auth_user_id").references(() => authUsers.id).notNull(),
isSuperAdmin: integer('is_super_admin', { mode: 'boolean' }),

})

/** settings ============================================== **/

export const settings = sqliteTable( 'settings', {
  id: pk(),
  maintenance: integer('maintenance', { mode: 'boolean' }),
  editedBy: text('edited_by'),
  updatedAt: integer('updated_at', { mode : 'timestamp' }),
})

export const settingsRels = sqliteTable('settings_rels', {
  id: pk(),
  path: text('path'),
  position: integer('position'),
  ownerId: text("owner_id").references(() => settings.id, { onDelete: 'cascade' }),
  mediasId:  text('medias_id').references(() => medias.id, { onDelete: 'cascade' }),
  
})

export const rel_settingsRels = relations(settings, ({ many }) => ({
  medias: many(medias),
}))

export const rel_settingsRelsHasOneSettings = relations(settingsRels, ({ one }) => ({
  settings : one(settings, {
    fields: [settingsRels.ownerId],
    references: [settings.id],
  }),
}))

export const rel_settingsHasMany = relations(settings, ({ many }) => ({
  settingsRels: many(settingsRels),
}))

/** navigation ============================================== **/

export const navigation = sqliteTable( 'navigation', {
  id: pk(),
  editedBy: text('edited_by'),
  updatedAt: integer('updated_at', { mode : 'timestamp' }),
})

export const navigationTreeMainNav = sqliteTable( 'navigation_tree_main_nav', {
  id: pk(),
  path: text('path'),
  position: real('position'),
  label: text('label'),
  link: text('link', { mode: 'json'}),
  ownerId: text("owner_id").references(() => navigation.id, { onDelete: 'cascade' }),
})

export const navigationTreeFooterNav = sqliteTable( 'navigation_tree_footer_nav', {
  id: pk(),
  path: text('path'),
  position: real('position'),
  label: text('label'),
  link: text('link', { mode: 'json'}),
  ownerId: text("owner_id").references(() => navigation.id, { onDelete: 'cascade' }),
})

export const rel_navigationTreeMainNavHasOneNavigation = relations(navigationTreeMainNav, ({ one }) => ({
  navigation : one(navigation, {
    fields: [navigationTreeMainNav.ownerId],
    references: [navigation.id],
  }),
}))

export const rel_navigationTreeFooterNavHasOneNavigation = relations(navigationTreeFooterNav, ({ one }) => ({
  navigation : one(navigation, {
    fields: [navigationTreeFooterNav.ownerId],
    references: [navigation.id],
  }),
}))

export const rel_navigationHasMany = relations(navigation, ({ many }) => ({
  navigationTreeMainNav: many(navigationTreeMainNav),
navigationTreeFooterNav: many(navigationTreeFooterNav),
}))

/** infos ============================================== **/

export const infos = sqliteTable( 'infos', {
  id: pk(),
  email: text('email'),
  instagram: text('instagram'),
  address: text('address'),
  editedBy: text('edited_by'),
  updatedAt: integer('updated_at', { mode : 'timestamp' }),
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
  pagesBlocksParagraph,
  pagesBlocksImage,
  pagesBlocksSlider,
  pagesBlocksKeyFacts,
  pagesTreeFacts,
  pagesBlocksBlack,
  pagesBlocksContent,
  pagesRels,
  medias,
  news,
  staff,
  settings,
  settingsRels,
  navigation,
  navigationTreeMainNav,
  navigationTreeFooterNav,
  infos,
  authUsers,
  authAccounts,
  authVerifications,
  authSessions
}
export const relationFieldsMap: Record<string, any> = {
  pages : {"thumbnail":{"to":"medias"},"image":{"to":"medias"},"images":{"to":"medias"},"parent":{"to":"pages"}},
  medias : {},
  news : {},
  staff : {},
  settings : {"logo":{"to":"medias"}},
  navigation : {},
  infos : {}
}

   const schema = {
     pages,
      pagesBlocksParagraph,
      pagesBlocksImage,
      pagesBlocksSlider,
      pagesBlocksKeyFacts,
      pagesTreeFacts,
      pagesBlocksBlack,
      pagesBlocksContent,
      pagesRels,
      medias,
      news,
      staff,
      settings,
      settingsRels,
      navigation,
      navigationTreeMainNav,
      navigationTreeFooterNav,
      infos,
     rel_pagesBlocksParagraphHasOnePages,
      rel_pagesBlocksImageHasOnePages,
      rel_pagesBlocksSliderHasOnePages,
      rel_pagesBlocksKeyFactsHasOnePages,
      rel_pagesTreeFactsHasOnePages,
      rel_pagesBlocksBlackHasOnePages,
      rel_pagesBlocksContentHasOnePages,
      rel_pagesRelsHasOnePages,
      rel_pagesHasMany,
      rel_settingsRelsHasOneSettings,
      rel_settingsHasMany,
      rel_navigationTreeMainNavHasOneNavigation,
      rel_navigationTreeFooterNavHasOneNavigation,
      rel_navigationHasMany,
     authUsers,
     authAccounts,
     authVerifications,
     authSessions
 }

 export type Schema = typeof schema
 export default schema
 