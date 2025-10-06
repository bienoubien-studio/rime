import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { GetRegisterType } from 'rime';
import type { PrototypeSlug } from '../types.js';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import type { ColumnBaseConfig, ColumnDataType } from 'drizzle-orm';

// Basic types needed across multiple files
export type GenericAdapterInterfaceArgs = {
	db: BetterSQLite3Database<GetRegisterType<'Schema'>>;
	tables: GenericTables;
};

type GenericColumn = SQLiteColumn<ColumnBaseConfig<ColumnDataType, string>, Record<string, unknown>>;
type GenericColumns = {
	[x: string]: GenericColumn;
};

export type GenericTable = SQLiteTableWithColumns<{
	columns: GenericColumns;
	dialect: string;
	name: string;
	schema: undefined;
}>;

export type GenericTables = Record<string, GenericTable | SQLiteTableWithColumns<any>>;

export type TableLocaleName = `${PrototypeSlug}Locales`;
