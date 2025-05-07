import { invalidateAll } from '$app/navigation';
import { getContext, onMount, setContext } from 'svelte';
import { toast } from 'svelte-sonner';
//@ts-expect-error command-score has no types
import commandScore from 'command-score';
import { isUploadConfig } from '$lib/util/config.js';
import { isFormField, isGroupFieldRaw, isTabsFieldRaw } from '../../util/field.js';
import { getValueAtPath, hasProp } from '$lib/util/object.js';
import type { Field, FormField } from '$lib/types/fields.js';
import type { GenericDoc } from '$lib/types/doc.js';
import type { CompiledCollection } from '$lib/types/config.js';
import type { FieldPanelTableConfig } from '$lib/types/panel.js';
import type { WithRequired } from '$lib/types/util.js';
import { env } from '$env/dynamic/public';
import cloneDeep from 'clone-deep';
import { snapshot } from '$lib/util/state.js';
import { toNestedStructure } from '$lib/util/doc.js';

type SortMode = 'asc' | 'dsc';
type DisplayMode = 'list' | 'grid' | 'nested';

function createCollectionStore<T extends GenericDoc = GenericDoc>({
	initial,
	config,
	canCreate
}: Args<T>) {
	let initialDocs = $state.raw(initial);
	let docs = $state(initial);
	let sortingOrder = $state<SortMode>('asc');
	let sortingBy = $state<string>('updatedAt');
	let selectMode = $state(false);
	let selected = $state<string[]>([]);
	let displayMode = $state<DisplayMode>('list');
	let stamp = $state(Date.now()); // Add a timestamp to track changes
	const statusList = $derived(config.status && Array.isArray(config.status) ? config.status : null)

	onMount(() => {
		displayMode =
			(localStorage.getItem(`collection.${config.slug}.display`) as DisplayMode) || 'list';
		const localSortBy = localStorage.getItem(`collection.${config.slug}.sortBy`);
		sortingBy = localSortBy || 'updatedAt';
		const localSortOrder = localStorage.getItem(`collection.${config.slug}.sortOrder`) as SortMode;
		sortingOrder = localSortOrder || 'asc';
		if (localSortBy) {
			sortBy(sortingBy, false);
		}
	});

	$effect(() => {
		if (!selectMode) selected = [];
	});

	const nested = $derived.by(() => toNestedStructure(docs))

	const buildFieldColumns = (fields: Field[], parentPath: string = '') => {
		let columns: Array<{ path: string } & WithRequired<FormField, 'table'>> = [];
		for (const field of fields) {
			if (isGroupFieldRaw(field)) {
				// For group fields, pass the current group name as parent path for nested fields
				const groupPath = parentPath ? `${parentPath}.${field.name}` : field.name;
				columns = [...columns, ...buildFieldColumns(field.fields, groupPath)];
			}
			if (isFormField(field) && hasProp('table', field)) {
				// Create current field path
				const path = parentPath ? `${parentPath}.${field.name}` : field.name;
				// Add path property to the field for accessing nested values
				columns.push({ ...field, path });
			} else if (isTabsFieldRaw(field)) {
				for (const tab of field.tabs) {
					// For tab fields, create a path with the tab name
					const path = parentPath ? `${parentPath}.${tab.name}` : tab.name;
					columns = [...columns, ...buildFieldColumns(tab.fields, path)];
				}
			}
		}
		return columns;
	};

	const columns = buildFieldColumns(config.fields)
		.map((col) => {
			// Set column position
			// @TODO : do it when building config ?
			let tableConfig: FieldPanelTableConfig = { position: 99 };
			if (typeof col.table === 'number') {
				tableConfig.position = col.table;
			} else if (typeof col.table === 'object' && 'position' in col.table) {
				tableConfig = { ...col.table, position: col.table.position || 99 };
			}
			return { ...col, table: tableConfig };
		})
		.sort((a, b) => a.table.position - b.table.position);

	
	const sortBy = (fieldName: string, toggle: boolean = true) => {
		if (sortingBy === fieldName) {
			if (toggle) {
				sortingOrder = sortingOrder === 'asc' ? 'dsc' : 'asc';
			}
		} else {
			// Else sort by field asc
			sortingBy = fieldName;
		}
		// Do sorting logic
		const orderMult = sortingOrder === 'asc' ? 1 : -1;
		docs = docs.sort((a, b) => {
			if (a[fieldName] < b[fieldName]) {
				return -1 * orderMult;
			}
			if (a[fieldName] > b[fieldName]) {
				return 1 * orderMult;
			}
			return 0;
		});
		// Save to local storage
		localStorage.setItem(`collection.${config.slug}.sortBy`, fieldName);
		localStorage.setItem(`collection.${config.slug}.sortOrder`, sortingOrder);
	};

	const deleteDocs = async (ids: string[]) => {
		let errorsCount = 0;

		const toDelete = [...docs].filter((doc) => ids.includes(doc.id));
		docs = docs.filter((doc) => !ids.includes(doc.id));
		initialDocs = docs;

		// Build the promise for each doc
		const promises = ids.map(async (id) => {
			return fetch(`/api/${config.slug}/${id}`, {
				method: 'DELETE',
				headers: {
					'content-type': 'application/json'
				}
			}).then((response) => {
				if (response.status !== 200) {
					const docError = toDelete.find((doc) => doc.id === id);
					docs.push(docError!);
					initialDocs = docs;
				}
				return response;
			});
		});

		await Promise.all(promises);

		// Inform user if all delete succeed
		let message = `Successfully deleted ${ids.length} docs`;
		if (errorsCount > 0) {
			message = `Successfully deleted ${ids.length - errorsCount} docs, ${errorsCount} errors`;
			toast.warning(message);
		} else {
			toast.success(message);
		}

		await invalidateAll();
	};
	
	/**
	 * Rebuilds nested positions for all documents in the hierarchy
	 * @param documents Array of documents to process
	 * @returns [orderedDocs, docsToUpdate] - Ordered documents and documents that need updating
	 */
	const rebuildNestedPositions = (documents: GenericDoc[]) => {
		const docsToUpdate: GenericDoc[] = [];

		// Process documents at current level
		const orderedDocs = documents.map((doc, index) => {
			const clone = cloneDeep(doc);
			// Update position if needed
			if (clone.nestedPosition !== index) {
				clone.nestedPosition = index;
				docsToUpdate.push(clone);
			}
			// Process children recursively if they exist
			if (clone._children && clone._children.length) {
				const [orderedChildren, childrenToUpdate] = rebuildNestedPositions(clone._children);
				clone._children = orderedChildren;
				docsToUpdate.push(...childrenToUpdate);
			}
			return clone;
		});
		return [orderedDocs, docsToUpdate];
	}

	/**
	 * Handle document move operations with parent-child relationships
	 * @param params Object containing from and to information
	 */
	const handleNestedDocumentMove = async ({ from, to, documentId }: {
		documentId: string,
		from: { parent: string | null, index: number },
		to: { parent: string | null, index: number },
	}) => {
		
		// console.log('move ' + documentId)
		// console.log('from.parent', from.parent)
		// console.log('from.index', from.index)
		// console.log('to.parent', to.parent)
		// console.log('to.index', to.index)

		// Step 1: Get the document from the flat docs array
		const docToMove = docs.find(d => d.id === documentId) as GenericDoc;
		if (!docToMove) return;

		// Step 2: Get a deep clone of the current nested structure
		const nestedDocs = cloneDeep(snapshot(nested));

		// Step 3: Find source parent array in nested structure
		const findArrayInNested = (docs: any[], parentId: string | null): any[] => {
			// If looking for root level
			if (parentId === null) return docs;
			
			// Create a helper function to search with a proper return value
			const search = (docs: any[], targetId: string): { found: boolean, array: any[] } => {
				// Check current level first
				for (const doc of docs) {
					if (doc.id === targetId) {
						// Initialize _children if it doesn't exist
						if (!doc._children) doc._children = [];
						return { found: true, array: doc._children };
					}
				}
				
				// Then check children
				for (const doc of docs) {
					if (doc._children && doc._children.length > 0) {
						const result = search(doc._children, targetId);
						if (result.found) {
							return result;
						}
					}
				}
				
				// Not found
				return { found: false, array: [] };
			};
			
			// Run the search
			const result = search(docs, parentId);
			return result.array;
		};

		// Step 4: Find source and target arrays
		let sourceArray = findArrayInNested(nestedDocs, from.parent);
		let targetArray = findArrayInNested(nestedDocs, to.parent);

		// console.log('sourceArray', sourceArray)
		// console.log('targetArray', targetArray)

		
		// Step 5: Find the document in the source array
		const sourceIndex = sourceArray.findIndex(d => d.id === documentId);
		if (sourceIndex === -1) return; // Document not found in source

		// Step 6: Create a simplified representation for the nested structure
		const docForNested = {
			id: docToMove.id,
			title: docToMove.title,
			nestedPosition: to.index,
			_children: sourceArray[sourceIndex]._children || []
		};

		// Step 7: Remove from source array
		sourceArray.splice(sourceIndex, 1);

		// Step 8: Insert into target array
		targetArray.splice(to.index, 0, docForNested);

		sourceArray = sourceArray.map((element, index) => ({
			...element,
			nestedPosition: index
		}))
		targetArray = targetArray.map((element, index) => ({
			...element,
			nestedPosition: index
		}))

		// Step 9: Update the flat docs based on the new nested structure
		const updateFlatDocs = (nestedDocs: any[], parentId: string | null = null): [GenericDoc[], GenericDoc[]] => {
			const updates: GenericDoc[] = [];
			const newFlatDocs: GenericDoc[] = [];
			const clones = cloneDeep(nestedDocs)

			// // Process each document at this level
			clones.forEach((nestedDoc, index) => {
				// Find the corresponding document in the flat array
				const flatDoc = docs.find(d => d.id === nestedDoc.id) as GenericDoc;
				if (!flatDoc) return;

				// Create a clone of the flat doc to update
				const updatedDoc = cloneDeep(flatDoc);

				// Update parent and position
				const newParent = parentId === null ? [] : [parentId];
				const parentChanged = JSON.stringify(updatedDoc.parent) !== JSON.stringify(newParent);
				const positionChanged = updatedDoc.nestedPosition !== index;

				// Apply updates
				updatedDoc.parent = newParent;
				updatedDoc.nestedPosition = index;

				// Add to new flat docs array
				newFlatDocs.push(updatedDoc);
				
				// If changed, add to updates array
				if (parentChanged || positionChanged) {
					updates.push(updatedDoc);
				}

				// Process children recursively
				if (nestedDoc._children && nestedDoc._children.length > 0) {
					const [childFlatDocs, childUpdates] = updateFlatDocs(nestedDoc._children, nestedDoc.id);
					newFlatDocs.push(...childFlatDocs);
					updates.push(...childUpdates);
				}
			});

			return [newFlatDocs, updates];
		};

		// Step 10: Update the flat docs with the new structure
		const [newFlatDocs, docsToUpdate] = updateFlatDocs(nestedDocs);
		
		// console.log(docsToUpdate)

		docs = newFlatDocs as T[];
		initialDocs = docs
		stamp = Date.now();

		// Step 11: Update the API
		if (docsToUpdate.length > 0) {
			return apiUpdateNestedStructure(docsToUpdate)
		} else {
			return new Promise(resolve => resolve(true))
		}
	};
	
	/**
	 * Update the nested structure via API calls and regenerate URLs for documents and their children
	 * @param docsToUpdate Array of documents that need updating
	 * @returns Promise that resolves to true if all updates succeeded
	 */
	const apiUpdateNestedStructure = async (docsToUpdate: GenericDoc[]): Promise<boolean> => {
		
		if (!docsToUpdate.length) {
			console.log('No documents to update');
			return true;
		}

		/**
		 * Recursively update a document and all its children
		 * @param docId ID of the document to update
		 * @param parentUpdate Whether this is a parent update (includes parent and nestedPosition) or just URL regeneration
		 * @param processedIds Set of document IDs that have already been processed to prevent infinite loops
		 */
			const updateDocumentAndChildren = async (
				doc: GenericDoc, 
				parentUpdate = true,
				processedIds = new Set<string>()
			): Promise<GenericDoc | null> => {
				// Prevent infinite loops or duplicate processing
				if (processedIds.has(doc.id)) {
					return null;
				}
				processedIds.add(doc.id);
				
				// Update the document
				const url = `${env.PUBLIC_RIZOM_URL}/api/${config.slug}/${doc.id}`;
				const body = JSON.stringify(
					parentUpdate 
						? { parent: doc.parent, nestedPosition: doc.nestedPosition }
						: { parent: doc.parent } // Just trigger URL regeneration
				);
				
				try {
					const response = await fetch(url, {
						method: 'PATCH',
						body: body,
						headers: {
							'Content-Type': 'application/json'
						}
					});
					
					if (!response.ok) {
						console.warn(`API error: ${response.status} for document ${doc.id}`);
						return null;
					}
					
					// Get the updated document
					const updatedDoc = await response.json();
					
					// Now fetch all children of this document
					const childrenResponse = await fetch(
						`${env.PUBLIC_RIZOM_URL}/api/${config.slug}?where[parent][in_array]=${doc.id}&select=id,parent`
					);
					
					if (!childrenResponse.ok) {
						console.warn(`Could not fetch children of document ${doc.id}`);
						return updatedDoc;
					}
					
					const childrenData = await childrenResponse.json();
					const children = childrenData.docs || [];
					
					// If there are children, recursively update each one
					if (children.length > 0) {
						// Process each child recursively (these are just URL regenerations, not parent updates)
						await Promise.all(
							children.map((child:GenericDoc) => updateDocumentAndChildren(child, false, processedIds))
						);
					}
					
					return updatedDoc;
				} catch (error) {
					console.error(`Error updating document ${doc.id}:`, error);
					return null;
				}
			};

			// Create API update promises for all documents that need updating
			const updatePromises = docsToUpdate.map(docToUpdate => 
				updateDocumentAndChildren(docToUpdate)
			);

			// Wait for all updates to complete
			try {
				const results = await Promise.all(updatePromises);
				// Update local docs with the updated versions
				results.forEach(updatedDoc => {
					if (updatedDoc) {
						updateDoc(updatedDoc as T);
					}
				});
				return true;
			} catch (error) {
				console.error('Error updating nested structure:', error);
				return false;
			}
		}

		function isList() {
			return displayMode === 'list';
		}
		function isGrid() {
			return displayMode === 'grid';
		}
		function isNested() {
			return displayMode === 'nested';
		}
		
		function display(mode: DisplayMode) {
			localStorage.setItem(`collection.${config.slug}.display`, mode);
			displayMode = mode;
		}

		function toggleSelectOf(docId: string) {
			if (selected.includes(docId)) {
				selected = selected.filter((id) => id !== docId);
			} else {
				selected.push(docId);
			}
		}

		function selectAll() {
			selected = docs.map((doc) => doc.id);
		}

		async function deleteSelection() {
			deleteDocs(selected);
			selectMode = false;
		}

		function filterBy(inputValue: string) {
			if (inputValue !== '') {
				const scores: any[] = [];
				for (const doc of initialDocs) {
					const asTitle = getValueAtPath(config.asTitle, doc);
					if (!asTitle) continue;
					const score = commandScore(asTitle, inputValue);
					if (score > 0) {
						scores.push({
							doc,
							score
						});
					}
				}
				const results = scores.sort(function (a, b) {
					if (a.score === b.score) {
						return a.doc[config.asTitle].localeCompare(b.doc[config.asTitle]);
					}
					return b.score - a.score;
				});
				docs = results.map((r) => r.doc);
			} else {
				docs = [...initialDocs];
			}
		}

		async function deleteDoc(id: string) {
			const res = await fetch(`/api/${config.slug}/${id}`, {
				method: 'DELETE',
				headers: {
					'content-type': 'application/json'
				}
			});
			if (res.status === 200) {
				docs = [...docs].filter((doc) => doc.id !== id);
			} else if (res.status === 404) {
				console.error('not found');
			}
		}

		function addDoc(doc: T) {
			docs.push(doc);
			sortBy(sortingBy, false);
		}

		function updateDoc(incomingDoc: T) {
			for (const [index, doc] of docs.entries()) {
				if (doc.id === incomingDoc.id) {
					docs[index] = incomingDoc;
					return;
				}
			}
		}

		return {
			get stamp() {
				return stamp;
			},
			get title() {
				return config.label.singular;
			},
			// logCollectionStructure,
			get statusList () {
				return statusList
			},
			config,
			canCreate,
			isList,
			isGrid,
			isNested,
			display,

			columns: columns as Array<{ path: string } & WithRequired<FormField, 'table'>>,
			sortBy,
			get sortingOrder() {
				return sortingOrder;
			},
			get sortingBy() {
				return sortingBy;
			},
			toggleSelectOf,
			selectAll,
			get selected() {
				return selected;
			},
			set selected(value) {
				selected = value;
			},
			get selectMode() {
				return selectMode;
			},
			set selectMode(bool) {
				selectMode = bool;
			},
			deleteSelection,

			filterBy,

			get isUpload() {
				return isUploadConfig(config);
			},


			/////////////////////////////////////////////
			// Docs
			//////////////////////////////////////////////
			addDoc,
			updateDoc,
			deleteDoc,
			deleteDocs,
			get docs() {
				return docs;
			},
			set docs(value) {
				docs = value;
				stamp = Date.now();
			},
			get length() {
				return docs.length;
			},
			
			get nested() {
				return nested
			},
			handleNestedDocumentMove,

		};
	}

	const COLLECTION_KEY = 'rizom.collection';

	export function setCollectionContext(args: Args) {
		const store = createCollectionStore(args);
		return setContext(`${COLLECTION_KEY}.${args.key || 'root'}`, store);
	}

	export function getCollectionContext(key: string = 'root') {
		return getContext<CollectionContext>(`${COLLECTION_KEY}.${key}`);
	}

	export type CollectionContext = ReturnType<typeof setCollectionContext>;

	type Args<T extends GenericDoc = GenericDoc> = {
		initial: T[];
		config: CompiledCollection;
		canCreate: boolean;
		key?: string;
	};
