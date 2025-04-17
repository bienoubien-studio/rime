import type { PrototypeSlug } from '$lib/types/doc';
import { asc, desc, getTableColumns, sql } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

type Args = {
	slug: PrototypeSlug;
	by?: string;
	tables: any;
};

export const buildOrderByParam = ({ tables, slug, by }: Args) => {
	//
	type KeyOfTables = keyof typeof tables;

	const table = tables[slug];
	if (!by) return [desc(table.createdAt)];
	const orderFunc = by.charAt(0) === '-' ? desc : asc;
	const columnStr = by.replace(/^-/, '');
	const tableColumns = Object.keys(getTableColumns(table));

	if (tableColumns.includes(columnStr)) {
		return [orderFunc(table[columnStr])];
	}

	const localeTableName = `${slug}Locales` as KeyOfTables;
	const localeTable = tables[localeTableName];
	const localizedColumns = getTableColumns(localeTable);

	if (Object.keys(localizedColumns).includes(columnStr)) {
		const { name: sqlLocaleTableName } = getTableConfig(localeTable);
		const { name: sqlTableName } = getTableConfig(table);
		return [
			orderFunc(
				sql.raw(
					`(SELECT DISTINCT ${sqlLocaleTableName}."${localizedColumns[columnStr].name}" FROM ${sqlLocaleTableName} WHERE ${sqlLocaleTableName}."owner_id" = ${sqlTableName}."id")`
				)
			)
		];
	}

	return [desc(table.createdAt)];
};
