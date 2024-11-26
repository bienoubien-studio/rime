<script lang="ts">
	import { moveItem } from '$lib/utils/array.js';
	import { getPanelThumbnailKey, isUploadConfig } from '$lib/config/utils.js';
	import Upload from './upload/Upload.svelte';
	import Default from './default/Default.svelte';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import { Field } from '../index.js';
	import { snapshot } from '$lib/utils/state.js';
	import type { RelationFieldItem } from './types.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import type { Relation } from '$lib/db/relations.js';
	import type { RelationField, GenericDoc } from 'rizom/types';

	// Props
	type Props = { path: string; config: RelationField; form: DocumentFormContext };
	const { path, config, form }: Props = $props();

	// Context
	const { getCollectionConfig } = getConfigContext();
	const locale = getLocaleContext();

	let intialItems: RelationFieldItem[] = $state([]);

	// State
	const field = $derived(form.useField(path, config));
	const initialValue = form.getRawValue(path);
	let initialPath = $state.raw(path);

	const relationConfig = getCollectionConfig(config.relationTo);
	let isRelationToUpload = isUploadConfig(relationConfig);
	let items = $state<RelationFieldItem[]>([]);

	let selectedIds = $state<string[]>([]);
	let selectedItems = $state<RelationFieldItem[]>([]);
	let isFull = $derived(
		(!config.many && selectedIds.length === 1) ||
			(config.many && selectedIds.length === intialItems.length) ||
			false
	);

	function toRelationFieldItem(doc: GenericDoc) {
		const item: RelationFieldItem = {
			label: doc[relationConfig.asTitle] || '[undefined]',
			relationId: doc.id
		};
		if (isUploadConfig(relationConfig)) {
			const isRelationToImage = doc.mimeType?.includes('image');
			item.isImage = isRelationToImage;
			item.filename = doc.filename;
			item.filesize = doc.filesize;
			item.mimeType = doc.mimeType;
			if (isRelationToImage) {
				const thumbnailKey = getPanelThumbnailKey(relationConfig);
				item.imageURL = doc[thumbnailKey];
			}
		}
		if (form.isLive) {
			item.livePreview = doc;
		}
		return item;
	}

	// Fetch
	const getItems = async () => {
		const res = await fetch(`/api/${relationConfig.slug}${form.isLive ? '?depth=1' : ''}`, {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});

		if (res.ok) {
			const { docs } = await res.json();
			intialItems = docs.map((doc: GenericDoc) => toRelationFieldItem(doc));
			if (field.value && Array.isArray(field.value) && field.value.length) {
				selectedIds = field.value.map((relation: Relation) => relation.relationId);
			}
		}
	};

	$effect(() => {
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

	$effect(() => {
		selectedItems = selectedIds.map(
			(id) => intialItems.filter((item) => item.relationId === id)[0]
		);
		items = intialItems.filter((item) => !selectedIds.includes(item.relationId));
	});

	// Actions
	const buildRelationFieldValue = () => {
		const relations = selectedIds.map((relationId, index) => {
			const existingRelation = retreiveRelation(relationId);
			let relation: Omit<Relation, 'parentId'> = {
				id: existingRelation?.id,
				relationTo: config.relationTo,
				path,
				position: index,
				relationId: relationId
			};
			if (config.localized) {
				relation.locale = locale.code;
			}
			if (form.isLive) {
				const initialItem = intialItems.find((item) => item.relationId === relationId);
				if (initialItem && initialItem.livePreview) {
					relation.livePreview = snapshot(initialItem.livePreview);
				}
			}
			return relation;
		});

		return relations;
	};

	const onRelationCreated = (doc: GenericDoc) => {
		intialItems.push(toRelationFieldItem(doc));
	};

	const onOrderChange = async (oldIndex: number, newIndex: number) => {
		let selectedIdsCopy = moveItem(selectedIds, oldIndex, newIndex);
		selectedIds = selectedIdsCopy;
		field.value = buildRelationFieldValue();
	};

	const addValue = async (relationId: string) => {
		if (isFull) return;
		selectedIds = [...selectedIds, relationId];
		items = items.filter((item) => item.relationId !== relationId);
		field.value = buildRelationFieldValue();
	};

	const removeValue = async (incomingId: string) => {
		selectedIds = [...selectedIds].filter((relationId) => relationId !== incomingId);
		field.value = buildRelationFieldValue();
	};

	/** When parent iterable (ex:Blocks) order change rebuild to get the correct path field */
	$effect(() => {
		async function reBuild() {
			field.value = buildRelationFieldValue();
			initialPath = path;
		}
		if (initialPath !== path) {
			reBuild();
		}
	});

	const RelationComponent = isRelationToUpload ? Upload : Default;
</script>

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />

	<RelationComponent
		{path}
		isSortable={!!config.many}
		hasError={!!field.error}
		formNestedLevel={form.nestedLevel}
		{onRelationCreated}
		readOnly={form.readOnly}
		{isFull}
		{addValue}
		{items}
		{selectedItems}
		{removeValue}
		{relationConfig}
		{onOrderChange}
	/>

	<Field.Error error={field.error} />
</Field.Root>
