import type { GenericDoc } from '$lib/core/types/doc.js';
import type { CompiledCollection, CompiledArea } from '$lib/core/config/types.js';
import type { Dic } from '$lib/util/types.js';
import { isUploadConfig } from '$lib/util/config.js';
import { snapshot } from './state.js';
import type { RequestEvent } from '@sveltejs/kit';

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
	config: CompiledCollection | CompiledArea,
	event?: RequestEvent
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
						prev[curr.name] = curr.defaultValue({ event });
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

	if (config.type === 'collection' && isUploadConfig(config) && 'imageSizes' in config && config.imageSizes) {
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
 * // Result: [{ id: '1', _children: [{ id: '2', _children: [] }] }]
 */
/**
 * Converts a flat array of documents into a nested tree structure
 * based on _parent and _position fields
 */
export const toNestedStructure = (documents: GenericDoc[]) => {
	const incomingDocs = snapshot(documents);

	// Create a map for quick document lookup by ID
	const docById = new Map<string, GenericDoc>();
	incomingDocs.forEach((doc) => docById.set(doc.id, doc));

	// Track processed documents to prevent infinite recursion
	const processed = new Set<string>();

	// Process documents recursively
	const processDocument = (doc: GenericDoc): GenericDoc => {
		if (!doc || processed.has(doc.id)) {
			return doc;
		}

		processed.add(doc.id);
		const result = { ...doc };

		// Process children first (depth-first)
		if (Array.isArray(result._children)) {
			result._children = result._children
				.map((id: string) => {
					const childDoc = docById.get(id);
					return childDoc ? processDocument(childDoc) : null;
				})
				.filter(Boolean);
		}

		// Only set the parent ID, don't process it recursively
		if (result._parent && typeof result._parent === 'string') {
			result._parent = docById.get(result._parent)?.id || null;
		}

		return result;
	};

	const output = incomingDocs
		.filter((doc) => !doc._parent)
		.map(processDocument)
		.sort((a, b) => (a._position || 0) - (b._position || 0));

	// Filter to get root documents and process them
	return output;
};
