import type { GenericDoc } from '$lib/core/types/doc.js';
import type { CompiledCollection, CompiledArea } from '$lib/core/config/types/index.js';
import type { Dic } from '$lib/util/types.js';
import { isUploadConfig } from '$lib/util/config.js';
import { snapshot } from './state.js';
import cloneDeep from 'clone-deep';


/**
 * Creates a blank document based on a collection or area configuration.
 * Initializes all fields with appropriate default values based on their type.
 * 
 * @param config - The compiled collection or area configuration containing field definitions
 * @returns A new blank document with default values for all fields
 * 
 * @example
 * // Create a blank document for the 'pages' collection
 * const blankPage = createBlankDocument(config.getCollection('pages'));
 */
export const createBlankDocument = <T extends GenericDoc = GenericDoc>(
	config: CompiledCollection | CompiledArea
): T => {
	/**
	 * Recursively processes field definitions to create a blank document structure.
	 * Handles special field types like tabs, blocks, relations, and nested fields.
	 */
	function reduceFieldsToBlankDocument(prev: Dic, curr: any) {
		try {
			if (curr.type === 'tabs') {
				curr.tabs.forEach((tab: any) => {
					prev[tab.name] = tab.fields.reduce(reduceFieldsToBlankDocument, {});
				});
			} else if (['blocks', 'relation', 'tree'].includes(curr.type)) {
				prev[curr.name] = [];
			} else if ('fields' in curr) {
				prev[curr.name] = curr.fields.reduce(reduceFieldsToBlankDocument, {});
			} else {
				if(curr.defaultValue !== undefined){
					if(typeof curr.defaultValue === 'function'){
						prev[curr.name] = curr.defaultValue();	
					}else{
						prev[curr.name] = curr.defaultValue;	
					}
				}else{
					prev[curr.name] = null;
				}
			}
		} catch (err) {
			console.error(curr);
			throw err;
		}
		return prev;
	}

	const fields: GenericDoc['fields'] = config.fields.reduce(reduceFieldsToBlankDocument, {});
	const empty = {
		...fields,
		_type: config.slug,
		_prototype: config.type
	};

	if (
		config.type === 'collection' &&
		isUploadConfig(config) &&
		'imageSizes' in config &&
		config.imageSizes
	) {
		empty.sizes = {};
	}

	return empty as T;
};

/**
 * Converts a flat array of documents into a nested tree structure based on parent-child relationships.
 * Documents are organized hierarchically with each document containing its children in the _children property.
 * 
 * @param documents - Array of documents with parent properties indicating their relationships
 * @returns A nested tree structure where each document contains its children
 * 
 * @example
 * // Convert a flat list of pages into a hierarchical structure
 * const pageTree = toNestedStructure(pagesList);
 * // Result: [{ id: 'home', _children: [{ id: 'about', _children: [] }] }]
 */
export const toNestedStructure = (documents: GenericDoc[]) => {
	const clones = cloneDeep(snapshot(documents));
	// Step 1: Group documents by their parent
	const docsByParent = new Map<string | null, GenericDoc[]>();
	docsByParent.set(null, []); // Initialize root group

	// Group documents by their parent ID
	clones.forEach((doc: GenericDoc) => {
		const hasParent = doc.parent && doc.parent.length > 0;
		const isRelationString = hasParent && typeof doc.parent[0] === 'string';
		const isRelationValue = hasParent && !isRelationString && 'documentId' in doc.parent[0];
		let parentId: string | null = null;

		if (isRelationString) {
			parentId = doc.parent[0];
		} else if (isRelationValue) {
			parentId = doc.parent[0].documentId;
		}

		// Check If a parent document has been deleted
		const parentExists = documents.find((doc) => doc.id === parentId);
		if (!parentExists) {
			parentId = null;
		}

		if (!docsByParent.has(parentId)) {
			docsByParent.set(parentId, []);
		}
		docsByParent.get(parentId)!.push(doc);
	});

	// Step 2: Sort each group by nestedPosition
	docsByParent.forEach((group) => {
		group.sort((a, b) => {
			const posA = typeof a.nestedPosition === 'number' ? a.nestedPosition : 0;
			const posB = typeof b.nestedPosition === 'number' ? b.nestedPosition : 0;
			return posA - posB;
		});
	});
	
	/**
	 * Recursively builds a tree structure starting from a specific parent ID.
	 */
	const buildTree = (parentId: string | null): GenericDoc[] => {
		const children = docsByParent.get(parentId) || [];
		return children.map((doc: GenericDoc) => {
			// Create a copy of the document
			const node = { ...doc };
			// Recursively get children for this node
			node._children = buildTree(doc.id);
			return node;
		});
	};

	return buildTree(null);
};
