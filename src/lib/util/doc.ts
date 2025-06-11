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
				if (curr.defaultValue !== undefined) {
					if (typeof curr.defaultValue === 'function') {
						prev[curr.name] = curr.defaultValue();
					} else {
						prev[curr.name] = curr.defaultValue;
					}
				} else {
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
/**
 * Converts a flat array of documents into a nested tree structure
 * based on _parent and _position fields
 */
export const toNestedStructure = (documents: GenericDoc[]) => {
	// Create a map for quick document lookup by ID
	const docById = new Map<string, GenericDoc>();
	documents.forEach((doc) => docById.set(doc.id, doc));

	// Track which documents are children of others
	const childDocIds = new Set<string>();

	// Sort documents by their position
	const sortedDocuments = [...documents].sort((a, b) => (a._position || 0) - (b._position || 0));

	// First pass: build the tree structure
	for (const doc of sortedDocuments) {
		// Handle children arrays
		if (Array.isArray(doc._children)) {
			doc._children = doc._children
				.map((id: string) => {
					const childDoc = docById.get(id);
					if (childDoc) {
						childDocIds.add(id); // Mark as child
					}
					return childDoc;
				})
				.filter(Boolean);
		}

		// Handle parent references
		if (doc._parent) {
			const parentDoc = docById.get(doc._parent);
			if (parentDoc) {
				if (!parentDoc._children) parentDoc._children = [];
				parentDoc._children.push(doc);
				childDocIds.add(doc.id);
			}
		}
	}

	// Return only root documents (those without a parent or not marked as children)
	return sortedDocuments.filter((doc) => !doc._parent && !childDocIds.has(doc.id));
};
