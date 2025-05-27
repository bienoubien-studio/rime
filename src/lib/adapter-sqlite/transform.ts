import { omit } from '../util/object.js';
import { flatten, unflatten } from 'flat';
import { toPascalCase } from '../util/string.js';
import type { Relation } from './relations.js';
import deepmerge from 'deepmerge';
import type {
	AreaSlug,
	CollectionSlug,
	GenericBlock,
	GenericDoc,
	PrototypeSlug,
	RawDoc
} from '$lib/core/types/doc.js';
import type { ConfigInterface } from '$lib/core/config/index.server.js';
import type { Dic } from '$lib/util/types.js';
import { extractFieldName } from '../fields/tree/util.js';
import { privateFieldNames } from '../core/collections/auth/config/privateFields.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { Rizom } from '../core/rizom.server.js';
import { logger } from '../core/logger/index.server.js';
import { getBlocksTableNames, getTreeTableNames, makeVersionsTableName, transformDatabaseColumnsToPaths } from '../util/schema.js';

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type CreateTransformInterfaceArgs = {
	configInterface: ConfigInterface;
	tables: any;
};
export type TransformInterface = ReturnType<typeof databaseTransformInterface>;

/////////////////////////////////////////////
// Interface
//////////////////////////////////////////////

export const databaseTransformInterface = ({
	configInterface,
	tables
}: CreateTransformInterfaceArgs) => {
	type Transformed<T> = Omit<T, '_url' | '_type' | '_prototype'> & {
		title?: string;
	};

	const transformDoc = async <T extends GenericDoc = GenericDoc>(args: {
		doc: RawDoc;
		slug: AreaSlug | CollectionSlug;
		locale?: string;
		event: RequestEvent;
		depth?: number;
		withBlank?: boolean;
	}): Promise<Transformed<T>> => {
		//

		const { slug, locale, event, withBlank = true, depth = 0 } = args;
		const { rizom } = event.locals

		let doc = args.doc;

		const config = configInterface.getBySlug(slug)
		const isVersioned = !!config.versions
		const tableName = isVersioned ? makeVersionsTableName(slug) : slug;
		const tableNameRelationFields = `${tableName}Rels`;
		const tableNameLocales = `${tableName}Locales`;
		const isLive = event.url.pathname.startsWith('/live');
		const isPanel = event.url.pathname.startsWith('/panel') || isLive;

		let docRizom;
		if (configInterface.isCollection(slug)) {
			docRizom = rizom.collection(slug);
		} else {
			docRizom = rizom.area(slug);
		}

		const blankDocument = docRizom.blank();

		/** Add localized fields */
		if (locale && tableNameLocales in tables && doc[tableNameLocales]) {
			doc = { ...doc[tableNameLocales][0], ...doc };
			delete doc[tableNameLocales];
			delete doc.ownerId;
		}
		
		let flatDoc: Dic = flatten(doc);

		// Transform flattened keys from database schema format to document format
		flatDoc = transformDatabaseColumnsToPaths(flatDoc);
		
		/////////////////////////////////////////////
		// Blocks handling
		//////////////////////////////////////////////

		/** Extract all blocks  */
		const blocksTables = getBlocksTableNames(tableName, tables);
		const blocks: Dic[] = blocksTables.flatMap((blockTable) => doc[blockTable] || []);


		/** Place each block in its path */
		for (let block of blocks) {
			const blockLocaleTableName = `${tableName}Blocks${toPascalCase(block.type)}Locales`;
			if (locale && blockLocaleTableName in tables) {
				block = {
					...((block[blockLocaleTableName][0] as Partial<GenericBlock>) || {}),
					...block
				};
			}
			/** Clean */
			const { position, path } = block;
			if (!isPanel) {
				delete block.position;
				delete block.path;
				delete block.ownerId;
				delete block.locale;
			}
			delete block[blockLocaleTableName];

			/** Assign */
			flatDoc[`${path}.${position}`] = block;
		}

		/////////////////////////////////////////////
		// Tree handling
		//////////////////////////////////////////////

		/** Extract all blocks  */
		const treeTables = getTreeTableNames(tableName, tables);
		let treeBlocks: Dic[] = treeTables.flatMap((treeTable) => doc[treeTable] || []);

		treeBlocks = treeBlocks.sort((a, b) => a.path.localeCompare(b.path));

		/** Place each treeBlock in its path */
		for (let block of treeBlocks) {
			try {
				const [fieldName] = extractFieldName(block.path);
				const treeBlockLocaleTableName = `${tableName}Tree${toPascalCase(fieldName)}Locales`;

				if (locale && treeBlockLocaleTableName in tables) {
					block = {
						...((block[treeBlockLocaleTableName][0] as Partial<GenericBlock>) || {}),
						...block
					};
				}
				/** Clean */
				const { position, path } = block;
				if (!block._children) block._children = [];

				if (!isPanel) {
					delete block.position;
					delete block.path;
					delete block.ownerId;
					delete block.locale;
				}

				delete block[treeBlockLocaleTableName];
				/** Assign */

				flatDoc[`${path}.${position}`] = block;
			} catch {
				logger.error('error in ', block.path);
			}
		}

		/** Place relations */
		if (doc[tableNameRelationFields]) {
			for (const relation of doc[tableNameRelationFields]) {
				/** Relation collection key ex: usersId */
				const relationToIdKey = Object.keys(relation).filter(
					(key) => key.endsWith('Id') && key !== 'ownerId' && relation[key] !== null
				)[0] as PrototypeSlug;

				const relationToId = relation[relationToIdKey];
				const relationPath = relation.path;
				let relationOutput: Relation | GenericDoc | null;

				/** Get relation if depth > 0 */
				if (depth > 0) {
					const relationSlug = relationToIdKey.replace('Id', '') as CollectionSlug;
					relationOutput = await rizom
						.collection(relationSlug)
						.findById({ id: relationToId, locale: relation.locale, depth: depth - 1 });
				} else {
					/** Clean relation */
					for (const key of Object.keys(relation)) {
						/** Delete empty [table]Id */
						if (relation[key] === null) {
							delete relation[key];
						} else if (key.endsWith('Id') && key !== 'ownerId') {
							relation.relationTo = key.replace('Id', '');
							relation.documentId = relation[key];
							delete relation[key];
						}
					}
					if (!isPanel) {
						delete relation.position;
						delete relation.ownerId;
						delete relation.path;
					}
					relationOutput = relation;
				}

				/** Assign relation */
				if (!relation.locale || relation.locale === locale) {
					flatDoc[relationPath] = [...(flatDoc[relationPath] || []), relationOutput];
				}
			}
		}

		// Clean
		let output: Dic = unflatten(flatDoc);
		/** Remove tree/blocks table keys */
		const keysToDelete: string[] = [...blocksTables, ...treeTables];
		// Remove relation table keys
		if (tableNameRelationFields in output) {
			keysToDelete.push(tableNameRelationFields);
		}

		if (!isPanel || event.locals.user) {
			keysToDelete.push('authUserId', 'editedBy');
		}

		keysToDelete.push(...privateFieldNames);

		if (withBlank) {
			output = omit(keysToDelete, deepmerge(blankDocument, output));
		} else {
			output = omit(keysToDelete, output);
		}

		return output as T;
	};

	return {
		doc: transformDoc
	};
};

export type AdapterTransformInterface = ReturnType<typeof databaseTransformInterface>;
