import { invalidateAll } from '$app/navigation';
import { getContext, onMount, setContext } from 'svelte';
import { toast } from 'svelte-sonner';
//@ts-expect-error command-score has no types
import commandScore from 'command-score';
import { isUploadConfig } from 'rizom/util/config.js';
import { isFormField, isGroupFieldRaw, isNotHidden, isTabsFieldRaw } from '../../util/field.js';
import { hasProps } from 'rizom/util/object.js';
import type { Field, FormField } from 'rizom/types/fields.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { CompiledCollection } from 'rizom/types/config.js';
import type { FieldPanelTableConfig } from 'rizom/types/panel.js';
import type { WithRequired } from 'rizom/types/util.js';

type SortMode = 'asc' | 'dsc';
type DisplayMode = 'list' | 'grid';

function createCollectionStore({ initial, config, canCreate }: Args) {
	let initialDocs = $state.raw(initial);
	let docs = $state(initial);
	let sortingOrder = $state<SortMode>('asc');
	let sortingBy = $state<string>('updatedAt');
	let selectMode = $state(false);
	let selected = $state<string[]>([]);
	let displayMode = $state<DisplayMode>(
		(localStorage.getItem(`collection.${config.slug}.display`) as DisplayMode) || 'list'
	);

	onMount(() => {
		const localSortBy = localStorage.getItem(`collection.${config.slug}.sortBy`);
		sortingBy = localSortBy || 'updatedAt';
		sortingOrder = (localStorage.getItem(`collection.${config.slug}.sortOrder`) ||
			'asc') as SortMode;
		if (localSortBy) {
			sortBy(sortingBy);
		}
	});

	$effect(() => {
		if (!selectMode) selected = [];
	});

	const sortBy = (fieldName: string) => {
		if (sortingBy !== fieldName) {
			sortingBy = fieldName;
			sortingOrder = sortingOrder || 'asc';
		} else {
			sortingOrder = sortingOrder === 'asc' ? 'dsc' : 'asc';
		}
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
		localStorage.setItem(`collection.${config.slug}.sortBy`, fieldName);
		localStorage.setItem(`collection.${config.slug}.sortOrder`, sortingOrder);
	};

	const deleteDocs = async (ids: string[]) => {
		// Build the promise for each doc
		const promises = ids.map((id) =>
			fetch(`/api/${config.slug}/${id}`, {
				method: 'DELETE',
				headers: {
					'content-type': 'application/json'
				}
			})
		);

		const responses = await Promise.all(promises);

		// Parse result and check for errors
		let errorsCount = 0;
		for (const response of responses) {
			if (response.status !== 200) {
				errorsCount++;
			} else {
				const result = await response.json();
				docs = docs.filter((doc) => doc.id !== result.id);
				initialDocs = docs;
			}
		}

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

	const buildFieldColumns = (fields: Field[]) => {
		let columns: WithRequired<FormField, 'table'>[] = [];
		for (const field of fields) {
			if (isFormField(field) && isNotHidden(field) && hasProps(field, ['table'])) {
				columns.push(field);
			} else if (isGroupFieldRaw(field)) {
				columns = [...columns, ...buildFieldColumns(field.fields)];
			} else if (isTabsFieldRaw(field)) {
				for (const tab of field.tabs) {
					columns = [...columns, ...buildFieldColumns(tab.fields)];
				}
			}
		}
		return columns;
	};

	const columns = buildFieldColumns(config.fields)
		.map((col) => {
			// Set column position
			// TODO : do it when building config
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
		sortBy,
		columns: columns as WithRequired<FormField, 'table'>[],
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
					const asTitle = doc[config.asTitle];
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

		/////////////////////////////////////////////
		// Config
		//////////////////////////////////////////////
		get config() {
			return config;
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

		updateDoc(incomingDoc: GenericDoc) {
			for (const [index, doc] of docs.entries()) {
				if (doc.id === incomingDoc.id) {
					docs[index] = incomingDoc;
					return;
				}
			}
		},

		addDoc(doc: GenericDoc) {
			docs.push(doc);
		},

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
				console.log('not found');
			}
		},

		deleteDocs
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

type Args = {
	initial: GenericDoc[];
	config: CompiledCollection;
	canCreate: boolean;
	key?: string;
};
