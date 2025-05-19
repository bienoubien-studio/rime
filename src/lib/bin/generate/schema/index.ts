import buildRootTable from './root.js';
import write from './write.js';
import {
	templateAuth,
	templateExportRelationsFieldsToTable,
	templateExportSchema,
	templateExportTables,
	templateHead,
	templateImports,
	templateTable
} from './templates.js';
import type { BuiltConfig } from 'rizom/types/config.js';
import type { Dic } from 'rizom/types/util.js';
import { generateJunctionTableDefinition } from './relations/junction.js';
import { generateRelationshipDefinitions } from './relations/definition.js';
import { toCamelCase } from 'rizom/util/string.js';


export function generateSchemaString(config: BuiltConfig): string {
	const schema: string[] = [templateImports];
	let enumTables: string[] = [];
	let enumRelations: string[] = [];
	let relationFieldsExportDic: Dic = {};
	let blocksRegister: string[] = [];

	for (const collection of config.collections) {
		const collectionSlug = toCamelCase(collection.slug);
		let rootTableName = collectionSlug
		schema.push( templateHead(collection.slug) )

		if(collection.versions){
			enumTables = [...enumTables, collectionSlug];
			rootTableName = `${collectionSlug}Versions` 
			schema.push(templateTable(collectionSlug, ''))
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

		enumTables = [...enumTables, rootTableName, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[rootTableName]: relationFieldsMap
		};

		schema.push(
			collectionSchema,
			junctionTable,
			relationsDefinitions
		);

	}

	/**
	 * Areas
	 */
	for (const area of config.areas) {
		const areaSlug = toCamelCase(area.slug);

		let rootTableName = areaSlug
		schema.push( templateHead(area.slug) )

		if(area.versions){
			enumTables = [...enumTables, areaSlug];
			rootTableName = `${areaSlug}Versions` 
			schema.push(templateTable(areaSlug, ''))
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

		const { relationsDefinitions, relationsNames } = generateRelationshipDefinitions({
			relationsDic
		});

		const relationsTableNames = Object.values(relationsDic).flat();

		enumTables = [...enumTables, rootTableName, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[rootTableName]: relationFieldsMap
		};

		schema.push(areaSchema, junctionTable, relationsDefinitions);
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
