<script lang="ts">
	import { X } from 'lucide-svelte';
	import * as Command from '$lib/panel/components/ui/command/index';
	import * as Sheet from '$lib/panel/components/ui/sheet/index';
	import Document from '../../../areas/document/Document.svelte';
	import Button from '../../../ui/button/button.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import { makeEmptyDoc } from '$lib/utils/doc.js';
	import { dataError } from '$lib/panel/utility/dataError.js';
	import { dataFocused } from '$lib/panel/utility/dataFocused.js';
	import type { RelationComponentProps, RelationFieldItem } from '../types.js';
	import type { GenericDoc } from 'rizom/types/doc';
	import { useSortable } from 'rizom/panel/utility/Sortable';

	const {
		isFull,
		hasError,
		addValue,
		isSortable,
		selectedItems,
		removeValue,
		items,
		readOnly,
		relationConfig,
		onOrderChange,
		formNestedLevel,
		onRelationCreated
	}: RelationComponentProps = $props();

	const user = getUserContext();

	let search = $state('');
	let relationList: HTMLElement;
	let inputFocused = $state(false);
	let create = $state(false);
	let commandInput = $state<HTMLInputElement>();

	const onNestedDocumentCreated = (doc: GenericDoc) => {
		create = false;
		onRelationCreated(doc);
		addValue(doc.id);
	};

	const { sortable } = useSortable({
		animation: 150,
		filter: '.rz-command-input .rz-command-list',
		draggable: '.rz-relation__item',
		onEnd: function (evt) {
			if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
				onOrderChange(evt.oldIndex, evt.newIndex);
			}
		}
	});

	$effect(() => {
		if (isSortable) {
			sortable(relationList);
		}
	});

	const onSelect = (item: RelationFieldItem) => {
		addValue(item.relationId);
		search = '';
	};

	const inputWithItemsClass = $derived(
		selectedItems.length === 0 ? '' : 'rz-command-input-select--with-items'
	);
</script>

<div class="rz-relation">
	<Command.Root>
		<div
			class="rz-relation__list"
			use:dataError={hasError}
			use:dataFocused={inputFocused}
			bind:this={relationList}
			class:rz-relation__list--readonly={readOnly}
		>
			{#each selectedItems as item (item.relationId)}
				<div class="rz-relation__item" class:rz-relation__item--readonly={readOnly}>
					<span>{item.label}</span>
					<button
						class="rz-relation__remove-button"
						class:rz-relation__remove-button--readonly={readOnly}
						type="button"
						onclick={() => removeValue(item.relationId)}
					>
						<X size={13} />
					</button>
				</div>
			{/each}

			{#if !readOnly && !isFull}
				<Command.InputSelect
					onfocus={() => (inputFocused = true)}
					onblur={() => setTimeout(() => (inputFocused = false), 150)}
					ref={commandInput}
					class={inputWithItemsClass}
					bind:value={search}
					placeholder="Search..."
				/>

				{#if inputFocused}
					<Command.List>
						{#each items as item (item.relationId)}
							<Command.Item value={item.label} onSelect={() => onSelect(item)}>
								<span>{item.label}</span>
							</Command.Item>
						{/each}
						<Command.Empty>Nothing to select</Command.Empty>
					</Command.List>
				{/if}
			{/if}
		</div>
	</Command.Root>

	{#if relationConfig.access.create && relationConfig.access.create(user.attributes)}
		<Button
			class="rz-relation__create-button"
			onclick={() => (create = true)}
			variant="secondary"
			size="sm"
		>
			Create new {relationConfig.label || relationConfig.slug}
		</Button>
	{/if}

	<Sheet.Root bind:open={create} onOpenChange={(val) => (create = val)}>
		<Sheet.Trigger />
		<Sheet.Content side="right" showCloseButton={false}>
			<Document
				doc={makeEmptyDoc(relationConfig)}
				readOnly={false}
				onClose={() => (create = false)}
				operation="create"
				{onNestedDocumentCreated}
				nestedLevel={formNestedLevel + 1}
			/>
		</Sheet.Content>
	</Sheet.Root>
</div>

<style type="postcss">
	.rz-relation {
		margin-bottom: var(--rz-size-3);
		position: relative;

		:global(> * + *) {
			margin-top: var(--rz-size-2);
		}

		:global(.rz-command) {
			width: 100%;
			border-radius: var(--rz-radius-md);

			:global(.rz-command-input-select--with-items) {
				margin-left: var(--rz-size-2);
			}

			:global(.rz-command-list) {
				@mixin bg color-input;
				border: var(--rz-border);
				position: absolute;
				left: 0;
				right: 0;
				top: var(--rz-size-12);
				z-index: 10;
				border-radius: var(--rz-radius-md);
				box-shadow: var(--rz-shadow-md);
			}

			:global(.rz-command-item) {
				height: var(--rz-size-10);
			}
		}

		.rz-relation__list {
			@mixin bg color-input;
			border: var(--rz-border);
			border-radius: var(--rz-radius-md);
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: var(--rz-size-1);
			min-height: var(--rz-size-10);
			padding: var(--rz-size-2) var(--rz-size-3);
			transition: all 0.2s ease;
		}

		.rz-relation__list:global([data-focused]) {
			outline: none;
			--rz-ring-offset: 2px;
			@mixin ring var(--rz-color-ring);
		}

		.rz-relation__list:global([data-error]) {
			@mixin ring var(--rz-color-error);
		}

		.rz-relation__list--readonly {
			cursor: no-drop;
		}

		.rz-relation__item {
			background-color: hsl(var(--rz-ground-0));
			@mixin color ground-4;
			display: flex;
			align-items: center;
			gap: var(--rz-size-2);
			border-radius: var(--rz-radius-sm);
			padding: 0.18rem var(--rz-size-2);
			font-size: var(--rz-text-xs);
		}

		.rz-relation__item--readonly {
			opacity: 0.3;
			cursor: no-drop;
		}

		.rz-relation__remove-button {
			cursor: pointer;
		}

		.rz-relation__remove-button--readonly {
			cursor: no-drop;
		}
	}

	:global(.rz-sheet-content) {
		background-color: hsl(var(--rz-ground-6));
		width: 50%;
		padding: 0;
	}
</style>
