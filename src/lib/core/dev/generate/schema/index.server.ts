import buildRootTable from './root.server.js';
import write from './write.server.js';
import {
	templateAuth,
	templateDirectories,
	templateExportRelationsFieldsToTable,
	templateExportSchema,
	templateExportTables,
	templateHead,
	templateImports,
	templateRelationMany,
	templateRelationOne,
	templateAPIKey,
	templateTable
} from './templates.server.js';
import type { BuiltConfig } from '$lib/core/config/types/index.js';
import type { Dic } from '$lib/util/types.js';
import { generateJunctionTableDefinition } from './relations/junction.server.js';
import { generateRelationshipDefinitions } from './relations/definition.server.js';
import { toCamelCase, toPascalCase } from '$lib/util/string.js';
import { makeUploadDirectoriesSlug, makeVersionsSlug } from '../../../../util/schema.js';
import { date } from '$lib/fields/date/index.js';

export function generateSchemaString(config: BuiltConfig) {
	const schema: string[] = [templateImports];
	let enumTables: string[] = [];
	let enumRelations: string[] = [];
	let relationFieldsExportDic: Dic = {};
	const blocksRegister: string[] = [];

	for (const collection of config.collections) {
		const collectionSlug = toCamelCase(collection.slug);
		let rootTableName = collectionSlug;
		let versionsRelationsDefinitions: string[] = [];

		schema.push(templateHead(collection.slug));

		if (collection.versions) {
			// Collection that have versions may need some fields forced on the root table and not root_versions
			// process the root table with these fields first then, handle versions related tables creation

			// utility function to filter out fields
			const isRootField = (field: (typeof collection.fields)[number]) => '_root' in field.raw && field.raw._root;
			const isNotRootField = (field: (typeof collection.fields)[number]) => !('_root' in field.raw) || !field.raw._root;

			// 1. Process root table

			// base root fields for versioned tables
			const baseRootFields = [date('createdAt').hidden(), date('updatedAt').hidden()];

			// Split fields that should be used on the root table
			const rootFieldsFromConfig = [...collection.fields].filter(isRootField);
			const rootFields = [...rootFieldsFromConfig, ...baseRootFields];

			// Buiuld the main root buildRootTable with only _root fields and created/updatedAt
			const { schema: rootCollectionSchema } = buildRootTable({
				blocksRegister: [],
				fields: rootFields,
				rootName: rootTableName,
				locales: [],
				hasAuth: !!collection.auth,
				versionsFrom: false,
				tableName: rootTableName
			});
			// Ad the root table to the schema
			schema.push(rootCollectionSchema);

			// 2. Handle versions table rename and relation root <-> root_verions definition

			// overwrite the collection name with the _versions one to generate all table
			// eg. blocks, relation related to the _versions one
			rootTableName = makeVersionsSlug(collectionSlug);
			// Filter fields that should be processed, remove the _root ones
			collection.fields = collection.fields.filter(isNotRootField);

			// create specific relations between root <-> root_verions
			const manyVersionsToOneName = `rel_${rootTableName}HasOne${toPascalCase(collectionSlug)}`;
			const oneToManyVersionsName = `rel_${collectionSlug}HasMany${toPascalCase(rootTableName)}`;

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
			];

			// add the root table to :
			// export tables = { ... }
			enumTables = [...enumTables, collectionSlug];
			// add the root <-> root_versions relations to :
			// export schema = { ... }
			enumRelations = [...enumRelations, manyVersionsToOneName, oneToManyVersionsName];
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

		if (collection.upload) {
			schema.push(templateDirectories(collection.slug));
			enumTables = [...enumTables, makeUploadDirectoriesSlug(collection.slug)];
		}
		
		schema.push(collectionSchema, junctionTable, ...versionsRelationsDefinitions, relationsDefinitions);
	}

	/**
	 * Areas
	 */
	for (const area of config.areas) {
		const areaSlug = toCamelCase(area.slug);
		let rootTableName = areaSlug;
		let versionsRelationsDefinitions: string[] = [];

		schema.push(templateHead(area.slug));

		if (area.versions) {
			// For now, areas don't need to filter out fields with or without _root
			// as these fields would have no effect

			// Overrite
			rootTableName = makeVersionsSlug(areaSlug);
			const manyVersionsToOneName = `rel_${rootTableName}HasOne${toPascalCase(areaSlug)}`;
			const oneToManyVersionsName = `rel_${areaSlug}HasMany${toPascalCase(rootTableName)}`;

			const baseRootFields = [date('createdAt').hidden(), date('updatedAt').hidden()];

			schema.push(templateTable(areaSlug, baseRootFields.map((field) => field._toSchema()).join(',\n')));

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
			];

			enumTables = [...enumTables, areaSlug];
			enumRelations = [...enumRelations, manyVersionsToOneName, oneToManyVersionsName];
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
			versionsFrom: area.versions ? areaSlug : false
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

		const relationsTableNames = Array.from(new Set(Object.values(relationsDic).flat()));

		enumTables = [...enumTables, rootTableName, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[rootTableName]: relationFieldsMap
		};

		schema.push(areaSchema, junctionTable, ...versionsRelationsDefinitions, relationsDefinitions);
	}

	const HAS_API_KEY = config.collections.filter(c => c.auth?.type === 'apiKey').length
	
	schema.push(templateAuth);
	if(HAS_API_KEY){
		schema.push(templateAPIKey);
	}

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
