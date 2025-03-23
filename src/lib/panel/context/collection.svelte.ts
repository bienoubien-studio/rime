import { invalidateAll } from '$app/navigation';
import { getContext, onMount, setContext } from 'svelte';
import { toast } from 'svelte-sonner';
//@ts-expect-error command-score has no types
import commandScore from 'command-score';
import { isUploadConfig } from 'rizom/util/config.js';
import { isFormField, isGroupFieldRaw, isNotHidden, isTabsFieldRaw } from '../../util/field.js';
import { getValueAtPath, hasProp } from 'rizom/util/object.js';
import type { Field, FormField } from 'rizom/types/fields.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { CompiledCollection } from 'rizom/types/config.js';
import type { FieldPanelTableConfig } from 'rizom/types/panel.js';
import type { WithRequired } from 'rizom/types/util.js';

type SortMode = 'asc' | 'dsc';
type DisplayMode = 'list' | 'grid';

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

		const toDelete = [ ...docs ].filter(doc => ids.includes(doc.id))
		docs = docs.filter((doc) => !ids.includes(doc.id));
		initialDocs = docs;

		// Build the promise for each doc
		const promises = ids.map(async (id) => {
			return fetch(`/api/${config.slug}/${id}`, {
				method: 'DELETE',
				headers: {
					'content-type': 'application/json'
				}
			}).then(response => {
				if (response.status !== 200) {
					const docError = toDelete.find(doc => doc.id === id)
					docs.push(docError!)
					initialDocs = docs
				}
				return response;
			})
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

		// Tell sveltekit to reload data
		// it's seems that it's not working as expected
		// as initialDocs remain the same and we need to manually
		// set it above
		await invalidateAll();
	};

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
		// Sort Column
		.sort((a, b) => a.table.position - b.table.position);

	return {
		config,
		sortBy,
		columns: columns as Array<{ path: string } & WithRequired<FormField, 'table'>>,
		canCreate,

		/////////////////////////////////////////////
		// Display Mode
		//////////////////////////////////////////////
		isList() {
			return displayMode === 'list';
		},
		isGrid() {
			return displayMode === 'grid';
		},
		display(mode: DisplayMode) {
			localStorage.setItem(`collection.${config.slug}.display`, mode);
			displayMode = mode;
		},

		/////////////////////////////////////////////
		// Selection
		//////////////////////////////////////////////

		toggleSelectOf(docId: string) {
			if (selected.includes(docId)) {
				selected = selected.filter((id) => id !== docId);
			} else {
				selected.push(docId);
			}
		},

		selectAll() {
			selected = docs.map((doc) => doc.id);
		},

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

		async deleteSelection() {
			deleteDocs(selected);
			selectMode = false;
		},

		/////////////////////////////////////////////
		// Sorting / Fitering
		//////////////////////////////////////////////
		get sortingOrder() {
			return sortingOrder;
		},
		get sortingBy() {
			return sortingBy;
		},

		filterBy(inputValue: string) {
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
		},

		get isUpload() {
			return isUploadConfig(config);
		},

		get title() {
			return config.label.singular;
		},

		/////////////////////////////////////////////
		// Docs
		//////////////////////////////////////////////
		get docs() {
			return docs;
		},

		set docs(value) {
			docs = value;
		},

		get length() {
			return docs.length;
		},

		updateDoc(incomingDoc: T) {
			for (const [index, doc] of docs.entries()) {
				if (doc.id === incomingDoc.id) {
					docs[index] = incomingDoc;
					return;
				}
			}
		},

		addDoc(doc: T) {
			docs.push(doc);
			sortBy(sortingBy, false)
		},

		deleteDocs,

		async deleteDoc(id: string) {
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
		},

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
