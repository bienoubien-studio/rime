<script lang="ts">
	import { GripVertical } from 'lucide-svelte';
	import { capitalize } from '$lib/utils/string.js';
	import ToggleBlockButton from './ToggleBlockButton.svelte';
	import { useOnce } from '$lib/panel/utility/Once.svelte';
	import RenderFields from 'rizom/panel/components/fields/RenderFields.svelte';
	import TreeBlock from './TreeBlock.svelte';
	import type { TreeBlockProps } from './types';

	const {
		config,
		treeKey,
		deleteBlock,
		duplicateBlock,
		form,
		sorting = false,
		path
	}: TreeBlockProps = $props();

	let currentPath = $state(path);
	let isOpen = $state(false);
	const position = $derived(parseInt(currentPath.split('.').pop() || '0'));
	const itemValue = $derived(form.useValue(path));

	const { once } = useOnce();

	once(() => {
		isOpen = (localStorage.getItem(`${itemValue.id}:open`) || 'true') === 'true';
	});

	const toggleBlock = (e: MouseEvent) => {
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
		isOpen = !isOpen;
		localStorage.setItem(`${itemValue.id}:open`, isOpen.toString());
	};

	const renderBlockTitle = () => {
		if (config.renderTitle) {
			const title = config.renderTitle({ fields: itemValue });
			if (title) return title;
		}
		const title = config.label ? config.label : capitalize(config.name);
		return title;
	};

	$effect(() => {
		if (currentPath !== path) {
			let pathArr = path.split('.');
			form.setValue(`${path}.path`, pathArr.toSpliced(pathArr.length - 1, 1).join('.'));
			currentPath = path;
		}
	});
</script>

<div data-path={currentPath} data-sorting={sorting} class="rz-tree-item">
	<div class="rz-tree-item__grip">
		<GripVertical size={15} />
	</div>

	<div class="rz-tree-item__content" class:rz-tree-item__content--closed={!isOpen}>
		<header class="rz-tree-item__header">
			<button type="button" onclick={toggleBlock} class="rz-tree-item__title-button">
				<div class="rz-tree-item__title">
					<h3 class="rz-tree-item__heading">
						{renderBlockTitle()} - {path}
					</h3>
				</div>
			</button>

			<!-- <BlockActions {duplicateBlock} {deleteBlock} /> -->
		</header>

		<div class="rz-tree-item__fields" class:rz-tree-item__fields--hidden={!isOpen}>
			<RenderFields fields={config.fields} {path} {form} />
		</div>
	</div>

	<div data-path={currentPath} data-tree-key={treeKey} class="rz-tree__list">
		{#if itemValue._children && itemValue._children.length}
			{#each itemValue._children as child, index (child.id)}
				<TreeBlock {form} {sorting} {treeKey} path="{currentPath}._children.{index}" {config} />
			{/each}
		{/if}
	</div>
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

	.rz-tree-item:hover
		> :global(.rz-tree-item__content > .rz-tree-item__header > .rz-tree-item-actions) {
		opacity: 1;
		pointer-events: all;
	}

	.rz-tree-item__header {
		display: flex;
		flex-direction: column;
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
		:global(.rz-tree-item-actions) {
			position: absolute;
			opacity: 0;
			pointer-events: none;
			top: var(--rz-size-1);
			right: var(--rz-size-11);
		}
		&:global(:has(.rz-field-error)) {
			@mixin ring var(--rz-color-error);
		}
	}

	.rz-tree-item__content + .rz-tree__list {
		margin-top: 1rem;
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
		position: absolute;
		opacity: 0;
		pointer-events: none;
		top: var(--rz-size-1);
		right: var(--rz-size-11);
	}
</style>
