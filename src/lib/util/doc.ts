import type { GenericDoc } from 'rizom/types/doc.js';
import type { CompiledCollection, CompiledArea } from 'rizom/types/config.js';
import type { Link } from '../fields/link/types.js';
import type { Dic } from 'rizom/types/util.js';
import { isUploadConfig } from 'rizom/util/config.js';
import { snapshot } from './state.js';
import cloneDeep from 'clone-deep';

export const createBlankDocument = <T extends GenericDoc = GenericDoc>(
	config: CompiledCollection | CompiledArea
): T => {
	function reduceFieldsToBlankDocument(prev: Dic, curr: any) {
		try {
			if (curr.type === 'tabs') {
				curr.tabs.forEach((tab: any) => {
					prev[tab.name] = tab.fields.reduce(reduceFieldsToBlankDocument, {});
				});
			} else if (curr.type === 'group') {
				prev[curr.name] = curr.fields.reduce(reduceFieldsToBlankDocument, {});
			} else if (curr.type === 'link') {
				const emptyLink: Link = { value: '', target: '_self', type: 'url' };
				prev[curr.name] = emptyLink;
			} else if (['blocks', 'relation', 'select', 'tree'].includes(curr.type)) {
				prev[curr.name] = [];
			} else if ('fields' in curr) {
				prev[curr.name] = curr.fields.reduce(reduceFieldsToBlankDocument, {});
			} else {
				prev[curr.name] = null;
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
	 * Convert flat documents array to a nested tree structure
	 * @param documents Array of documents to convert to tree structure
	 * @returns Nested tree structure of documents
	 */
	export const toNestedStructure = (documents: GenericDoc[]) => {
		
		const clones = cloneDeep(snapshot(documents))
		// Step 1: Group documents by their parent
		const docsByParent = new Map<string | null, GenericDoc[]>();
		docsByParent.set(null, []); // Initialize root group

		// Group documents by their parent ID
		clones.forEach((doc: GenericDoc) => {
			const hasParent = doc.parent && doc.parent.length > 0
			const isRelationString = hasParent && typeof doc.parent[0] === 'string'
			const isRelationValue = hasParent && !isRelationString && 'documentId' in doc.parent[0]
			let parentId:string | null = null
			
			if (isRelationString) {
				parentId = doc.parent[0]
			} else if (isRelationValue) {
				parentId = doc.parent[0].documentId
			}

			// Check If a parent document has been deleted
			const parentExists = documents.find(doc => doc.id === parentId)
			if(!parentExists){
				parentId = null
			}

			if (!docsByParent.has(parentId)) {
				docsByParent.set(parentId, []);
			}
			docsByParent.get(parentId)!.push(doc);
		});

		// Step 2: Sort each group by nestedPosition
		docsByParent.forEach(group => {
			group.sort((a, b) => {
				const posA = typeof a.nestedPosition === 'number' ? a.nestedPosition : 0;
				const posB = typeof b.nestedPosition === 'number' ? b.nestedPosition : 0;
				return posA - posB;
			});
		});

		// Step 3: Build the tree recursively
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
	}