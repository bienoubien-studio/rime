import buildRootTable from './root.js';
import write from './write.js';
import {
	templateAuth,
	templateExportRelationsFieldsToTable,
	templateExportSchema,
	templateExportTables,
	templateHead,
	templateImports,
	templateRelationMany,
	templateRelationOne,
	templateTable
} from './templates.js';
import type { BuiltConfig } from 'rizom/types/config.js';
import type { Dic } from 'rizom/types/util.js';
import { generateJunctionTableDefinition } from './relations/junction.js';
import { generateRelationshipDefinitions } from './relations/definition.js';
import { toCamelCase, toPascalCase } from 'rizom/util/string.js';
import { makeVersionsTableName } from '../../../util/schema.js';


export function generateSchemaString(config: BuiltConfig) {
	const schema: string[] = [templateImports];
	let enumTables: string[] = [];
	let enumRelations: string[] = [];
	let relationFieldsExportDic: Dic = {};
	let blocksRegister: string[] = [];

	for (const collection of config.collections) {

		const collectionSlug = toCamelCase(collection.slug);
		let rootTableName = collectionSlug
		let versionsRelationsDefinitions: string[] = []

		schema.push(templateHead(collection.slug))

		if (collection.versions) {
			rootTableName = makeVersionsTableName(collectionSlug)
			const manyVersionsToOneName = `rel_${rootTableName}HasOne${toPascalCase(collectionSlug)}`
			const oneToManyVersionsName = `rel_${collectionSlug}HasMany${toPascalCase(rootTableName)}`
			
			schema.push(templateTable(collectionSlug, `createdAt: integer('created_at', { mode : 'timestamp' }),\n\tupdatedAt: integer('updated_at', { mode : 'timestamp' })`))
			
			versionsRelationsDefinitions = [
				templateRelationOne({
					name: manyVersionsToOneName,
					table: rootTableName,
					parent: collectionSlug
				}),
				templateRelationMany({
					name: oneToManyVersionsName,
					table: collectionSlug,
					many: [rootTableName]
				})
			]

			enumTables = [...enumTables, collectionSlug];
			enumRelations = [ ...enumRelations, manyVersionsToOneName, oneToManyVersionsName]
		}

		const {
			schema: collectionSchema,
			relationsDic,
			relationFieldsMap,
			relationFieldsHasLocale
		} = buildRootTable({
			blocksRegister,
			fields: collection.fields,
			rootName: rootTableName,
			locales: config.localization?.locales || [],
			hasAuth: !!collection.auth,
			versionsFrom: collection.versions ? collectionSlug : false,
			tableName: rootTableName
		});

		const { junctionTable, junctionTableName } = generateJunctionTableDefinition({
			tableName: rootTableName,
			relationFieldsMap,
			hasLocale: relationFieldsHasLocale
		});

		if (junctionTable.length) {
			relationsDic[rootTableName] ??= [];
			relationsDic[rootTableName].push(junctionTableName);
		}

		const { relationsDefinitions, relationsNames } = generateRelationshipDefinitions({
			relationsDic
		});

		const relationsTableNames = Object.values(relationsDic).flat();

		enumTables = Array.from(new Set([...enumTables, rootTableName, ...relationsTableNames]));
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[rootTableName]: relationFieldsMap
		};

		schema.push(
			collectionSchema,
			junctionTable,
			...versionsRelationsDefinitions,
			relationsDefinitions
		);

	}

	/**
	 * Areas
	 */
	for (const area of config.areas) {
		const areaSlug = toCamelCase(area.slug);
		let rootTableName = areaSlug
		let versionsRelationsDefinitions: string[] = []

		schema.push(templateHead(area.slug))

		if (area.versions) {
			rootTableName = makeVersionsTableName(areaSlug)
			const manyVersionsToOneName = `rel_${rootTableName}HasOne${toPascalCase(areaSlug)}`
			const oneToManyVersionsName = `rel_${areaSlug}HasMany${toPascalCase(rootTableName)}`
			
			schema.push(templateTable(areaSlug, `createdAt: integer('created_at', { mode : 'timestamp' }),\n\tupdatedAt: integer('updated_at', { mode : 'timestamp' })`))
			
			versionsRelationsDefinitions = [
				templateRelationOne({
					name: manyVersionsToOneName,
					table: rootTableName,
					parent: areaSlug
				}),
				templateRelationMany({
					name: oneToManyVersionsName,
					table: areaSlug,
					many: [rootTableName]
				})
			]

			enumTables = [...enumTables, areaSlug];
			enumRelations = [...enumRelations, manyVersionsToOneName, oneToManyVersionsName]
		}

		const {
			schema: areaSchema,
			relationsDic,
			relationFieldsMap,
			relationFieldsHasLocale
		} = buildRootTable({
			blocksRegister,
			fields: area.fields,
			rootName: rootTableName,
			locales: config.localization?.locales || [],
			tableName: rootTableName,
			versionsFrom: area.versions ? areaSlug : false,
		});

		const { junctionTable, junctionTableName } = generateJunctionTableDefinition({
			tableName: rootTableName,
			relationFieldsMap,
			hasLocale: relationFieldsHasLocale
		});

		if (junctionTable.length) {
			relationsDic[rootTableName] ??= [];
			relationsDic[rootTableName].push(junctionTableName);
		}


		const { relationsDefinitions, relationsNames } = generateRelationshipDefinitions({ relationsDic });

		const relationsTableNames = Array.from(new Set(Object.values(relationsDic).flat()));

		enumTables = [...enumTables, rootTableName, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[rootTableName]: relationFieldsMap
		};

		schema.push(
			areaSchema,
			junctionTable,
			...versionsRelationsDefinitions,
			relationsDefinitions
		);
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
