<script lang="ts">
	import { moveItem } from '$lib/util/array.js';
	import { isUploadConfig } from '$lib/util/config.js';
	import Upload from './upload/Upload.svelte';
	import Default from './default/Default.svelte';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import { Field } from 'rizom/panel';
	import { snapshot } from '$lib/util/state.js';
	import type { RelationFieldItem } from './types.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import type { Relation } from '$lib/sqlite/relations.js';
	import type { GenericDoc } from 'rizom/types';
	import type { RelationField } from '../index';
	import { onMount } from 'svelte';
	import { getValueAtPath } from 'rizom/util/object';
	import { root } from 'rizom/panel/components/fields/root.svelte.js';

	// Props
	type Props = { path: string; config: RelationField; form: DocumentFormContext };
	const { path, config, form }: Props = $props();

	// Context
	const { getCollection } = getConfigContext();
	const locale = getLocaleContext();
	
	let initialItems: RelationFieldItem[] = $state([]);
	const field = $derived(form.useField(path, config));
	let initialValue = form.getRawValue(path) || [];
	let stamp = $state(new Date().getTime().toString());

	const relationConfig = getCollection(config.relationTo);
	
	let availableItems = $state<RelationFieldItem[]>([]);
	const nothingToSelect = $derived(initialItems.length === 0);
	let selectedItems = $state<RelationFieldItem[]>([]);
	
	
	let isFull = $derived(
		(!config.many && selectedItems.length === 1) ||
			(config.many && selectedItems.length === availableItems.length) ||
			false
	);

	function documentToRelationFieldItem(doc: GenericDoc) {
		const itemInFieldValue = retreiveRelation(doc.id);
		const item: RelationFieldItem = {
			label: getValueAtPath(relationConfig.asTitle, doc) || '[untitled]',
			relationId: doc.id,
			editUrl: `/panel/${relationConfig.slug}/${doc.id}`
		};
		if (itemInFieldValue) {
			item.id = itemInFieldValue.id;
		}
		if (isUploadConfig(relationConfig)) {
			const isRelationToImage = doc.mimeType?.includes('image');
			item.isImage = isRelationToImage;
			item.filename = doc.filename;
			item.filesize = doc.filesize;
			item.mimeType = doc.mimeType;
			if (isRelationToImage) {
				item.imageURL = doc.sizes.thumbnail;
			}
		}
		if (form.isLive) {
			item.livePreview = doc;
		}
		return item;
	}

	// Fetch
	const getItems = async () => {
		// Create a URL object with the base path
		const url = new URL(`/api/${relationConfig.slug}`, window.location.origin);
		
		// Add depth parameter if in live context
		if (form.isLive) {
			url.searchParams.append('depth', '1');
		}
		
		// Add custom query parameters if provided
		if (config.query) {
			if (typeof config.query === 'string') {
				// Parse the query string and add each parameter
				const queryParams = new URLSearchParams(config.query);
				queryParams.forEach((value, key) => {
					url.searchParams.append(key, value);
				});
			} else if (typeof config.query === 'function') {
				// Parse the function result and add each parameter
				const queryString = config.query(form.doc);
				const queryParams = new URLSearchParams(queryString);
				queryParams.forEach((value, key) => {
					url.searchParams.append(key, value);
				});
			}
		}
		
		const res = await fetch(url.pathname + url.search, {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});

		if (res.ok) {
			const { docs } = await res.json();
			initialItems = docs.map((doc: GenericDoc) => documentToRelationFieldItem(doc));
			selectedItems = initialValue.map((relation: Relation) => {
				return initialItems.find((item) => item.relationId === relation.relationId);
			});
		}
	};

	$inspect(selectedItems).with((type, value) => {
		if(path === 'attributes.parent') {
			console.log('--- selected items', type, value);
		}
	});
	
	onMount(() => {
		getItems();
	});

	const retreiveRelation = (relationId: string) => {
		if (initialValue && Array.isArray(initialValue) && initialValue.length) {
			for (const relation of initialValue) {
				if (relation.relationId === relationId) {
					return relation;
				}
			}
		}
		return null;
	};

	const getAvailableItems = () => {
		return initialItems.filter(
			(initialItem) =>
				!selectedItems.some((selectedItem) => selectedItem.relationId === initialItem.relationId)
		);
	};

	$effect(() => {
		availableItems = getAvailableItems();
	});

	// Actions
	const buildRelationFieldValue = () => {
		const relations = selectedItems.map((item, index) => {
			let relation: Omit<Relation, 'parentId'> = {
				id: item.id,
				relationTo: config.relationTo,
				path,
				position: index,
				relationId: item.relationId
			};
			if (config.localized) {
				relation.locale = locale.code;
			}
			if (form.isLive) {
				if (item && item.livePreview) {
					relation.livePreview = snapshot(item.livePreview);
				}
			}
			return relation;
		});

		return relations;
	};

	const onRelationCreation = () => {
		form.isDisabled = true;
	};

	const onRelationCreationCanceled = () => {
		form.isDisabled = false;
	};

	const onRelationCreated = (doc: GenericDoc) => {
		form.isDisabled = false;
		initialItems.push(documentToRelationFieldItem(doc));
		availableItems.push(documentToRelationFieldItem(doc));
	};

	const onOrderChange = async (oldIndex: number, newIndex: number) => {
		selectedItems = moveItem(selectedItems, oldIndex, newIndex);
		field.value = buildRelationFieldValue();
		stamp = new Date().getTime().toString();
	};

	const addValue = async (relationId: string) => {
		if (isFull) return;
		const itemToAdd = availableItems.find((item) => item.relationId === relationId);
		if (!itemToAdd) {
			throw new Error(`Can't find relation at ${path}`);
		}
		selectedItems = [...selectedItems, itemToAdd];
		field.value = buildRelationFieldValue();
	};

	const removeValue = async (incomingId: string) => {
		selectedItems = selectedItems.filter((item) => item.relationId !== incomingId);
		field.value = buildRelationFieldValue();
	};

	const isRelationToUpload = isUploadConfig(relationConfig);
	const RelationComponent = isRelationToUpload ? Upload : Default;
</script>

<fieldset class="rz-field-relation {config.className || ''}" use:root={field}>
	<Field.Label {config} />

	<RelationComponent
		{path}
		many={!!config.many}
		hasError={!!field.error}
		formNestedLevel={form.nestedLevel}
		readOnly={form.readOnly}
		{nothingToSelect}
		{onRelationCreated}
		{onRelationCreationCanceled}
		{onRelationCreation}
		{isFull}
		{stamp}
		{addValue}
		{availableItems}
		{selectedItems}
		{removeValue}
		{relationConfig}
		{onOrderChange}
	/>

	<Field.Error error={field.error} />
</fieldset>
