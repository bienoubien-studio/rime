<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import * as Sheet from '$lib/panel/components/ui/sheet/index.js';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import Sortable from 'sortablejs';
	import { Edit, File, X } from '@lucide/svelte';
	import Doc from 'rizom/panel/components/sections/document/Document.svelte';
	import UploadThumbCell from 'rizom/panel/components/sections/collection/upload-thumb-cell/UploadThumbCell.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte.js';
	import { createBlankDocument } from '$lib/util/doc.js';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import type { GenericDoc } from 'rizom/types/doc.js';
	import type { RelationComponentProps, RelationFieldItem } from '../types.js';
	import './upload.css';

	const {
		isFull,
		hasError,
		addValue,
		many,
		selectedItems,
		removeValue,
		availableItems,
		relationConfig,
		onOrderChange,
		formNestedLevel,
		onRelationCreation,
		onRelationCreationCanceled,
		onRelationCreated,
		stamp
	}: Omit<RelationComponentProps, 'readOnly'> = $props();

	const user = getUserContext();

	let open = $state(false);
	let create = $state(false);
	let instance: ReturnType<typeof Sortable.create>;

	const sortableOptions: Sortable.Options = {
		animation: 150,

		// group: new Date().getTime().toString(),
		onEnd: function (evt) {
			const { oldIndex, newIndex } = evt;
			if (oldIndex !== undefined && newIndex !== undefined) {
				onOrderChange(oldIndex, newIndex);
			}
		}
	};

	const onNestedDocumentCreated = (doc: GenericDoc) => {
		create = false;
		onRelationCreated(doc);
	};

	$effect(() => {
		if (many) {
			const list = document.querySelector(
				`.rz-relation-upload__list[data-list="${stamp}"]`
			) as HTMLDivElement;
			instance = Sortable.create(list, sortableOptions);
		}
	});

	$effect(() => {
		if (isFull) {
			open = false;
		}
	});

	onDestroy(() => {
		if (instance) instance.destroy();
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
			<p class="rz-relation-upload__filename">
				{item.filename} <a href={item.editUrl}><Edit size="12" /></a>
			</p>
			<p class="rz-relation-upload__filesize">{item.filesize}</p>
			<p class="rz-relation-upload__mimetype">{item.mimeType}</p>
		</div>

		<button
			type="button"
			class="rz-relation-upload__remove"
			onclick={() => removeValue(item.relationId)}
		>
			<X size={11} />
		</button>
	</div>
{/snippet}

{#snippet grid(item: RelationFieldItem)}
	<div class="rz-relation-upload__grid-item">
		<div class="rz-relation-upload__grid-thumbnail" style="--rz-upload-preview-cell-size: 100%">
			<UploadThumbCell url={item.imageURL} mimeType={item.mimeType} />
		</div>
		<div class="rz-relation-upload__grid-info">
			<p class="rz-relation-upload__grid-filename">{item.filename}</p>
			<p class="rz-relation-upload__grid-filesize">{item.filesize}</p>
			<p class="rz-relation-upload__grid-mimetype">{item.mimeType}</p>
		</div>
	</div>
{/snippet}

{#key stamp}
	<div
		class="rz-relation-upload__list"
		data-many={many ? '' : null}
		data-list={stamp}
		data-error={hasError ? '' : null}
	>
		{#each selectedItems as item (item.documentId)}
			{@render card(item)}
		{/each}
	</div>
{/key}

<div class="rz-relation-upload__actions">
	{#if !isFull && availableItems.length > 0}
		<Button onclick={() => (open = true)} variant="outline">
			Select a {relationConfig.label.singular || relationConfig.slug}
		</Button>
	{/if}

	{#if !isFull}
		{#if relationConfig.access.create && relationConfig.access.create(user.attributes, {})}
			<Button
				onclick={() => {
					create = true;
					onRelationCreation();
				}}
				variant="secondary"
			>
				Create new {relationConfig.label.singular || relationConfig.slug}
			</Button>
		{/if}
	{/if}
</div>

<Command.Dialog bind:open onOpenChange={(val) => (open = val)}>
	<Command.Input
		class="rz-relation-upload__search"
		placeholder={t__(
			`common.search_a|${relationConfig.label.gender}`,
			relationConfig.label.singular || relationConfig.slug
		)}
	/>

	<Command.List class="rz-relation-upload__command-list">
		<Command.Empty>No results found.</Command.Empty>
		{#each availableItems as item}
			<Command.Item
				class="rz-relation-upload__command-item"
				value={item.filename}
				onSelect={() => {
					addValue(item.documentId);
					open = false;
				}}
			>
				{@render grid(item)}
			</Command.Item>
		{/each}
	</Command.List>
</Command.Dialog>

<Sheet.Root
	bind:open={create}
	onOpenChange={(bool) => {
		create = bool;
		if (bool === false) {
			onRelationCreationCanceled();
		}
	}}
>
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
