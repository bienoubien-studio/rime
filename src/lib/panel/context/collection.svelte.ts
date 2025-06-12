import { invalidateAll } from '$app/navigation';
import { getContext, onMount, setContext } from 'svelte';
import { toast } from 'svelte-sonner';
//@ts-expect-error command-score has no types
import commandScore from 'command-score';
import { isUploadConfig } from '$lib/util/config.js';
import { isFormField, isGroupFieldRaw, isTabsFieldRaw } from '../../util/field.js';
import { getValueAtPath, hasProp } from '$lib/util/object.js';
import type { Field, FormField } from '$lib/fields/types.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { FieldPanelTableConfig } from '$lib/panel/types.js';
import type { WithRequired } from '$lib/util/types.js';
import { env } from '$env/dynamic/public';
import cloneDeep from 'clone-deep';
import { snapshot } from '$lib/util/state.js';
import { toNestedStructure } from '$lib/util/doc.js';
import { PARAMS } from '$lib/core/constant.js';
import { safe } from '$lib/util/safe.js';

type SortMode = 'asc' | 'dsc';
type DisplayMode = 'list' | 'grid' | 'nested';

function createCollectionStore<T extends GenericDoc = GenericDoc>({ initial, config, canCreate }: Args<T>) {
	let initialDocs = $state.raw(initial);
	let docs = $state(initial);
	let sortingOrder = $state<SortMode>('asc');
	let sortingBy = $state<string>('updatedAt');
	let selectMode = $state(false);
	let selected = $state<string[]>([]);
	let displayMode = $state<DisplayMode>('list');
	let stamp = $state(Date.now()); // Add a timestamp to track changes
	const hasVersions = $derived(!!config.versions);
	const hasDraft = $derived(config.versions && config.versions.draft);
	// const statusList = $derived(config.status && Array.isArray(config.status) ? config.status : null);

	onMount(() => {
		displayMode = (localStorage.getItem(`collection.${config.slug}.display`) as DisplayMode) || 'list';
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

	const nested = $derived.by(() => {
		return toNestedStructure(docs);
	});

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
			// @TODO : do it when building config ?
			// Set column position
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
			if (clone._position !== index) {
				clone._position = index;
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
	};

	/**
	 * Handle document move operations with parent-child relationships
	 * @param params Object containing from and to information
	 */
	const handleNestedDocumentMove = async ({
		from,
		to,
		documentId
	}: {
		documentId: string;
		from: { parent: string | null; index: number };
		to: { parent: string | null; index: number };
	}) => {
		// 1. Create a new array to track changes
		const updatedDocs = [...docs];
		const docToMove = updatedDocs.find((d) => d.id === documentId);
		if (!docToMove) return;

		// 2. Track all documents that need updating
		const docsToUpdate = new Map<string, GenericDoc>();

		// 3. Remove from old parent's children
		if (from.parent !== null) {
			const oldParent = updatedDocs.find((d) => d.id === from.parent);
			if (oldParent) {
				const oldChildren = [...(oldParent._children || [])];
				const childIndex = oldChildren.indexOf(documentId);
				if (childIndex > -1) {
					oldChildren.splice(childIndex, 1);
					oldParent._children = oldChildren;
					docsToUpdate.set(oldParent.id, oldParent);
				}
			}
		}

		// 4. Add to new parent's children
		if (to.parent !== null) {
			const newParent = updatedDocs.find((d) => d.id === to.parent);
			if (newParent) {
				const newChildren = [...(newParent._children || [])];
				newChildren.splice(to.index, 0, documentId);
				newParent._children = newChildren;
				docsToUpdate.set(newParent.id, newParent);
			}
		}

		// 5. Update the moved document
		docToMove._parent = to.parent;
		docToMove._position = to.index;
		docsToUpdate.set(docToMove.id, docToMove);

		// 6. Update positions for all affected siblings
		const siblings = updatedDocs
			.filter((doc) => doc._parent === to.parent && doc.id !== documentId)
			.sort((a, b) => (a._position || 0) - (b._position || 0));

		let position = 0;
		for (const sibling of siblings) {
			if (position === to.index) position++;
			if (sibling._position !== position) {
				sibling._position = position;
				docsToUpdate.set(sibling.id, sibling);
			}
			position++;
		}

		// 7. Update local state optimistically
		docs = updatedDocs;
		stamp = Date.now();

		// 8. Send updates to API
		try {
			await apiUpdateNestedStructure(Array.from(docsToUpdate.values()));
			return true;
		} catch (error) {
			console.error('Failed to update documents:', error);
			// Revert to current database docs
			docs = await fetch(`${env.PUBLIC_RIZOM_URL}/api/${config.slug}`)
				.then((r) => r.json())
				.then((r) => r.docs);
			stamp = Date.now();
			return false;
		}
	};

	/**
	 * Update the nested structure via API calls and regenerate URLs for documents
	 * @param docsToUpdate Array of documents that need updating
	 * @returns Promise that resolves to true if all updates succeeded
	 */
	const apiUpdateNestedStructure = async (docsToUpdate: GenericDoc[]) => {
		const promises = docsToUpdate.map((doc) => {
			let url = `${env.PUBLIC_RIZOM_URL}/api/${config.slug}/${doc.id}`;
			if (doc.versionId) {
				url += `?${PARAMS.VERSION_ID}=${doc.versionId}`;
			}
			return fetch(url, {
				method: 'PATCH',
				body: JSON.stringify({
					_parent: doc._parent,
					_position: doc._position
				}),
				headers: { 'Content-Type': 'application/json' }
			});
		});
		const [error, _] = await safe(Promise.all(promises));
		
		if (error) {
			console.error('API update failed:', error);
			throw error;
		}

		return true;
	};

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
			return config.label.plural;
		},

		get hasDraft() {
			return hasDraft;
		},
		get hasVersions() {
			return hasVersions;
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

		/****************************************************/
		// Docs
		/****************************************************/
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
			return nested;
		},
		handleNestedDocumentMove
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
