<script lang="ts">
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import * as Sheet from '$lib/panel/components/ui/sheet/index';
	import { File, X } from 'lucide-svelte';
	import Doc from 'rizom/panel/components/areas/document/Document.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import { useSortable } from '$lib/panel/utility/Sortable.js';
	import { createBlankDocument } from '$lib/utils/doc.js';
	import type { RelationComponentProps, RelationFieldItem } from '../types.js';
	import type { GenericDoc } from 'rizom/types';
	import './upload.css';
	import { __t } from 'rizom/panel/i18n/index.js';

	const {
		isFull,
		hasError,
		addValue,
		isSortable,
		selectedItems,
		removeValue,
		items,
		relationConfig,
		onOrderChange,
		formNestedLevel,
		onRelationCreated
	}: Omit<RelationComponentProps, 'readOnly'> = $props();

	const user = getUserContext();

	let relationList: HTMLElement;
	let open = $state(false);
	let create = $state(false);

	const { sortable } = useSortable({
		animation: 150,
		onEnd: function (evt) {
			const { oldIndex, newIndex } = evt;
			if (oldIndex !== undefined && newIndex !== undefined) {
				onOrderChange(oldIndex, newIndex);
			}
		}
	});

	const onNestedDocumentCreated = (doc: GenericDoc) => {
		create = false;
		onRelationCreated(doc);
		addValue(doc.id);
	};

	$effect(() => {
		if (isSortable) {
			sortable(relationList);
		}
	});

	$effect(() => {
		if (isFull) {
			open = false;
		}
	});
</script>

{#snippet row(item: RelationFieldItem)}
	<div class="rz-relation-upload__row">
		<div class="rz-relation-upload__thumbnail">
			{#if item.isImage}
				<img class="rz-relation-upload__image" src={item.imageURL} alt={item.filename} />
			{:else}
				<File size={18} />
			{/if}
		</div>
		<div class="rz-relation-upload__info">
			<p class="rz-relation-upload__filename">{item.filename}</p>
			<p class="rz-relation-upload__filesize">{item.filesize}</p>
			<p class="rz-relation-upload__mimetype">{item.mimeType}</p>
		</div>
		<button
			type="button"
			class="rz-relation-upload__remove"
			onclick={() => removeValue(item.relationId)}
		>
			<X size={15} />
		</button>
	</div>
{/snippet}

{#snippet grid(item: RelationFieldItem)}
	<div class="rz-relation-upload__grid-item">
		<div class="rz-relation-upload__grid-thumbnail">
			{#if item.isImage}
				<img class="rz-relation-upload__grid-image" src={item.imageURL} alt={item.filename} />
			{:else}
				<File size={18} />
			{/if}
		</div>
		<div class="rz-relation-upload__grid-info">
			<p class="rz-relation-upload__grid-filename">{item.filename}</p>
			<p class="rz-relation-upload__grid-filesize">{item.filesize}</p>
			<p class="rz-relation-upload__grid-mimetype">{item.mimeType}</p>
		</div>
	</div>
{/snippet}

<div class="rz-relation-upload__list" bind:this={relationList} data-error={hasError ? '' : null}>
	{#each selectedItems as item (item.relationId)}
		{@render row(item)}
	{/each}
</div>

<div class="rz-relation-upload__actions">
	{#if !isFull}
		<Button onclick={() => (open = true)} variant="outline">
			Select a {relationConfig.label.singular || relationConfig.slug}
		</Button>
	{/if}
	{#if relationConfig.access.create && relationConfig.access.create(user.attributes)}
		<Button onclick={() => (create = true)} variant="secondary">
			Create new {relationConfig.label.singular || relationConfig.slug}
		</Button>
	{/if}
</div>

<Command.Dialog bind:open onOpenChange={(val) => (open = val)}>
	<Command.Input
		class="rz-relation-upload__search"
		placeholder={__t(
			`common.search_a|${relationConfig.label.gender}`,
			relationConfig.label.singular || relationConfig.slug
		)}
	/>

	<Command.List class="rz-relation-upload__command-list">
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading={relationConfig.label.plural || relationConfig.slug}>
			{#each items as item}
				<Command.Item
					class="rz-relation-upload__command-item"
					value={item.filename}
					onSelect={() => {
						addValue(item.relationId);
						open = false;
					}}
				>
					{@render grid(item)}
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>

<Sheet.Root bind:open={create} onOpenChange={(val) => (create = val)}>
	<Sheet.Trigger />
	<Sheet.Content showCloseButton={false} class="rz-relation-upload__sheet" side="right">
		<Doc
			doc={createBlankDocument(relationConfig)}
			readOnly={false}
			onClose={() => (create = false)}
			operation="create"
			{onNestedDocumentCreated}
			nestedLevel={formNestedLevel + 1}
		/>
	</Sheet.Content>
</Sheet.Root>
