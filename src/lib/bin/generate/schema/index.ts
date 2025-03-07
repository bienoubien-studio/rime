import buildRootTable from './root.js';
import write from './write.js';
import { toSnakeCase } from '$lib/utils/string.js';

import {
	templateAuth,
	templateExportRelationsFieldsToTable,
	templateExportSchema,
	templateExportTables,
	templateHead,
	templateImports
} from './templates.js';
import type { BuiltConfig } from 'rizom/types/config.js';
import type { Dic } from 'rizom/types/utility.js';
import { generateJunctionTableDefinition } from './relations/junction.js';
import { generateRelationshipDefinitions } from './relations/definition.js';

export function generateSchemaString(config: BuiltConfig): string {
	const schema: string[] = [templateImports];
	let enumTables: string[] = [];
	let enumRelations: string[] = [];
	let relationFieldsExportDic: Dic = {};
	let blocksRegister: string[] = [];

	for (const collection of config.collections) {
		const collectionSlug = toSnakeCase(collection.slug);

		const {
			schema: collectionSchema,
			relationsDic,
			relationFieldsMap,
			relationFieldsHasLocale
		} = buildRootTable({
			blocksRegister,
			fields: collection.fields,
			rootName: collectionSlug,
			locales: config.localization?.locales || [],
			hasAuth: !!collection.auth,
			tableName: collectionSlug
		});

		const { junctionTable, junctionTableName } = generateJunctionTableDefinition({
			tableName: collectionSlug,
			relationFieldsMap,
			hasLocale: relationFieldsHasLocale
		});

		if (junctionTable.length) {
			relationsDic[collectionSlug] ??= [];
			relationsDic[collectionSlug].push(junctionTableName);
		}

		const { relationsDefinitions, relationsNames } = generateRelationshipDefinitions({
			relationsDic
		});

		const relationsTableNames = Object.values(relationsDic).flat();

		enumTables = [...enumTables, collectionSlug, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[collectionSlug]: relationFieldsMap
		};

		schema.push(
			templateHead(collection.slug),
			collectionSchema,
			junctionTable,
			relationsDefinitions
		);
	}

	/**
	 * Areas
	 */
	for (const area of config.areas) {
		const areaSlug = toSnakeCase(area.slug);

		const {
			schema: areaSchema,
			relationsDic,
			relationFieldsMap,
			relationFieldsHasLocale
		} = buildRootTable({
			blocksRegister,
			fields: area.fields,
			rootName: areaSlug,
			locales: config.localization?.locales || [],
			tableName: areaSlug
		});

		const { junctionTable, junctionTableName } = generateJunctionTableDefinition({
			tableName: areaSlug,
			relationFieldsMap,
			hasLocale: relationFieldsHasLocale
		});

		if (junctionTable.length) {
			relationsDic[areaSlug] ??= [];
			relationsDic[areaSlug].push(junctionTableName);
		}

		const { relationsDefinitions, relationsNames } = generateRelationshipDefinitions({
			relationsDic
		});

		const relationsTableNames = Object.values(relationsDic).flat();

		enumTables = [...enumTables, areaSlug, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[areaSlug]: relationFieldsMap
		};

		schema.push(templateHead(area.slug), areaSchema, junctionTable, relationsDefinitions);
	}

	schema.push(templateAuth);
	schema.push(templateExportTables(enumTables));
	schema.push(templateExportRelationsFieldsToTable(relationFieldsExportDic));
	schema.push(templateExportSchema({ enumTables, enumRelations }));

	return schema.join('\n').replace(/\n{3,}/g, '\n\n');
}

const generateSchema = (config: BuiltConfig) => {
	// const __filename = fileURLToPath(import.meta.url);
	// const __dirname = path.dirname(__filename);

	// // Try both .ts and .js extensions
	// const authTsPath = path.join(__dirname, '../../auth.ts');
	// const authJsPath = path.join(__dirname, '../../auth.js');

	// const authConfigPath =
	// 	'./' + path.relative(process.cwd(), existsSync(authTsPath) ? authTsPath : authJsPath);

	// const authSchemaOutput = path.resolve(process.cwd(), 'src/lib/server/schema.auth.ts');

	// const generateAuthArgsString = `@better-auth/cli generate --config ${authConfigPath} --output ${authSchemaOutput} --y`;
	// spawnSync('npx', generateAuthArgsString.split(' '), { stdio: 'inherit' });
	write(generateSchemaString(config));
};

export default generateSchema;
