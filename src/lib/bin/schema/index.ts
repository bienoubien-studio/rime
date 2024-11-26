import { buildRelations, buildFieldsRelations } from './relations.js';
import buildTable from './table.js';
import write from './write.js';
import { toSnakeCase } from '$lib/utils/string.js';

import {
	templateAuth,
	templateExportRelationsFieldsToTable,
	templateExportTables,
	templateHead
} from './templates.js';
import type { BuiltConfig } from 'rizom/types/config.js';
import type { Dic } from 'rizom/types/utility.js';

const generateSchema = (config: BuiltConfig) => {
	const schema: string[] = [];
	let enumTables: string[] = [];
	let enumRelations: string[] = [];
	let relationFieldsExportDic: Dic = {};

	for (const collection of config.collections) {
		const tableName = toSnakeCase(collection.slug);

		const { content, relationsDic, relationFieldsDic, relationFieldsHasLocale } = buildTable({
			fields: collection.fields,
			rootName: tableName,
			locales: config.localization?.locales || [],
			hasAuth: !!collection.auth,
			tableName
		});

		const { fieldsRelationContent, tableName: fieldsRelationsTableName } = buildFieldsRelations(
			tableName,
			relationFieldsDic,
			relationFieldsHasLocale
		);

		if (fieldsRelationContent.length) {
			relationsDic[tableName] = [...(relationsDic[tableName] || []), fieldsRelationsTableName];
		}

		const { relations, relationsNames } = buildRelations({
			table: tableName,
			relationsDic
		});

		const relationsTableNames = Object.keys(relationsDic)
			.map((key) => relationsDic[key])
			.flat();

		enumTables = [...enumTables, tableName, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[tableName]: relationFieldsDic
		};

		schema.push(templateHead(collection.slug), content, fieldsRelationContent, relations);
	}

	/**
	 * Globals
	 */
	for (const global of config.globals) {
		const tableName = toSnakeCase(global.slug);

		const { content, relationsDic, relationFieldsDic, relationFieldsHasLocale } = buildTable({
			fields: global.fields,
			rootName: tableName,
			locales: config.localization?.locales || [],
			tableName
		});

		const { fieldsRelationContent, tableName: fieldsRelationsTableName } = buildFieldsRelations(
			tableName,
			relationFieldsDic,
			relationFieldsHasLocale
		);

		if (fieldsRelationContent.length) {
			relationsDic[tableName] = [...(relationsDic[tableName] || []), fieldsRelationsTableName];
		}

		const { relations, relationsNames } = buildRelations({
			table: tableName,
			relationsDic
		});

		const relationsTableNames = Object.keys(relationsDic)
			.map((key) => relationsDic[key])
			.flat();

		enumTables = [...enumTables, tableName, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[tableName]: relationFieldsDic
		};

		schema.push(templateHead(global.slug), content, fieldsRelationContent, relations);
	}

	// const adminUserConfig = getAdminUsersConfig(config);
	schema.push(templateHead('Auth'), templateAuth);

	schema.push(templateExportTables([...enumTables, 'authUsers', 'sessions']));
	schema.push(templateExportRelationsFieldsToTable(relationFieldsExportDic));

	schema.push(`
    const schema = {
      ${enumTables.join(',\n')},
      ${enumRelations.length ? enumRelations.join(',\n') + ',' : ''}
      authUsers,
      sessions
  }
  export type Schema = typeof schema
  export default schema
  `);

	write(schema);
};

export default generateSchema;
