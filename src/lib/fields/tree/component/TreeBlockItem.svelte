<script lang="ts">
	import { GripVertical } from 'lucide-svelte';
	import RenderFields from 'rizom/panel/components/fields/RenderFields.svelte';
	import TreeBlockItem from './TreeBlockItem.svelte';
	import type { TreeBlockProps } from './types';
	import TreeBlockActions from './TreeBlockActions.svelte';
	import type { TreeBlock } from 'rizom/types/doc';
	import { extractFieldName } from 'rizom/operations/postprocess/tree.js';
	import { snapshot } from 'rizom/utils/state';

	const { config, treeKey, treeState, form, sorting = false, path }: TreeBlockProps = $props();

	const initialPath = $state(snapshot(path));
	const depth = $derived(
		path
			.replace(`${treeState.path}.`, '')
			.split('.')
			.filter((str) => str !== '_children').length
	);
	const position = $derived(parseInt(path.split('.').pop() || '0'));
	const itemValue = $derived(form.useValue<TreeBlock>(path));
	const parentPath = $derived(path.split('.').slice(0, -1).join('.'));
	const parentPathFormated = $derived.by(() => {
		if (depth === 1) return '';
		const [_, relativePath] = extractFieldName(parentPath);
		return (
			relativePath
				.split('.')
				.filter((str) => str !== '_children')
				.map((str) => parseInt(str) + 1)
				.join('.') + '.'
		);
	});
	let isOpen = $state(false);

	const toggleBlock = (e: MouseEvent) => {
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
		isOpen = !isOpen;
	};

	const renderBlockTitle = () => {
		if (config.renderTitle) {
			const title = config.renderTitle({ fields: itemValue || {} });
			if (title) return title;
		}
		return `${config.label || config.name}`;
	};

	$effect(() => {
		if (initialPath !== path) {
			form.setValue(path, itemValue);
		}
	});
</script>

<div
	data-path={path}
	data-tree-children={itemValue?._children.length || 0}
	data-sorting={sorting}
	class="rz-tree-item"
>
	<div class="rz-tree-item__grip">
		<GripVertical size={15} />
	</div>

	<div class="rz-tree-item__content" class:rz-tree-item__content--closed={!isOpen}>
		<header class="rz-tree-item__header">
			<button type="button" onclick={toggleBlock} class="rz-tree-item__title-button">
				<div class="rz-tree-item__title">
					{parentPathFormated}{position + 1}. {renderBlockTitle()}
				</div>
			</button>

			<TreeBlockActions deleteItem={() => treeState.deleteItem(parentPath, position)} />
		</header>

		<div class="rz-tree-item__fields" class:rz-tree-item__fields--hidden={!isOpen}>
			<RenderFields fields={config.fields} {path} {form} />
		</div>
	</div>

	{#if depth <= config.maxDepth}
		<div data-path={path} data-tree-depth={depth} data-tree-key={treeKey} class="rz-tree__list">
			{#if itemValue && itemValue._children && itemValue._children.length}
				{#each itemValue._children as child, index (child.id)}
					<TreeBlockItem
						{treeState}
						{form}
						{sorting}
						{treeKey}
						path="{path}._children.{index}"
						{config}
					/>
				{/each}
			{/if}
		</div>
	{:else}
		<div class="rz-tree-item__list-placeholder"></div>
	{/if}
</div>

<style type="postcss">
	.rz-tree-item {
		position: relative;
		/* border: var(--rz-border); */
	}

	.rz-tree-item__grip {
		cursor: grab;
		position: absolute;
		top: 1rem;
		left: -1rem;
	}

	.rz-tree-item__header:hover {
		> :global(.rz-tree-item-actions) {
			opacity: 1;
			pointer-events: all;
		}
	}

	.rz-tree-item__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: var(--rz-border);
		border-radius: var(--rz-radius-md) var(--rz-radius-md) 0 0;
		padding: var(--rz-size-2) var(--rz-size-4);
		height: var(--rz-size-14);
		flex-direction: row;
		background-color: hsl(var(--rz-ground-7));
		width: 100%;
	}

	.rz-tree-item__content--closed {
		&:global(:has(.rz-field-error)) {
			@mixin ring var(--rz-color-error);
		}
	}

	.rz-tree-item__content + .rz-tree-item__list-placeholder,
	.rz-tree-item__content + .rz-tree__list {
		margin-top: 1rem;
		min-height: 5px;
		/* border: 1px solid green; */
	}

	.rz-tree-item__title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--rz-size-2);
	}

	.rz-tree-item__fields {
		background-color: hsl(var(--rz-ground-7));
		border: var(--rz-border);
		border-top: none;
		border-radius: 0 0 var(--rz-radius-md) (--rz-radius-md);
		padding: var(--rz-size-6) 0 var(--rz-size-4) 0;
		flex: 1;
		/* padding: var(--rz-size-6) 0; */
	}

	.rz-tree-item__fields--hidden {
		display: none;
	}

	.rz-tree-item[data-sorting='true'] .rz-tree-item__grip {
		display: none;
	}

	:global(.rz-tree-item-actions) {
		opacity: 0;
		pointer-events: none;
	}
</style>
