import toSnakeCase from 'to-snake-case';
import dedent from 'dedent';
const s = toSnakeCase;

/** Templates Tables / Fields */

export const templateTable = (table: string, content: string): string => `
export const ${table} = sqliteTable( '${s(table)}', {
  id: pk(),
  ${content}
})
`;

export const templateLocale = () => 'locale: text("locale"),';

export const templateParent = (parent: string) => {
	return `parentId: text("parent_id").references(() => ${parent}.id, { onDelete: 'cascade' }),`;
};

export const templateHasAuth = `
  resetTokenExpireAt: integer("reset_token_expire_at", { mode: 'timestamp' }),
  resetToken: text("reset_token"),
  loginAttempts: integer("login_attempts").notNull().default(0),
  locked: integer("locked", { mode: 'boolean'}).notNull().default(false),
  lockedAt: integer("locked_at", { mode: 'timestamp'}),
  authUserId: text("auth_user_id").references(() => authUsers.id, { onDelete: 'cascade' }).notNull(),
`;

export const templateUniqueRequired = (field: { unique?: boolean; required?: boolean }) => {
	const { unique, required } = field;
	return `${unique ? '.unique()' : ''}${required ? '.notNull()' : ''}`;
};

/** Template rows Relation */

export const templateRelationOne = ({ name, table, parent }: RelationOneArgs): string => `
export const ${name} = relations(${table}, ({ one }) => ({
  ${parent} : one(${parent}, {
    fields: [${table}.parentId],
    references: [${parent}.id],
  }),
}))
`;

export const templateRelationMany = ({ name, table, many }: RelationManyArgs): string => `
export const ${name} = relations(${table}, ({ many }) => ({
  ${many.map((child) => `${child}: many(${child}),`).join('\n')}
}))
`;

/** Templates Field Relations */

export const templateFieldRelationColumn = (table: string) => {
	return `${table}Id:  text('${s(table)}_id').references(() => ${table}.id, { onDelete: 'cascade' })`;
};

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
    ${tables.join(',\n    ')}
  }
`;

export const templateAuth = `
export const authUsers = sqliteTable('auth_users', {
  id: pk(),
  table: text('table').notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull()
})`;

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
