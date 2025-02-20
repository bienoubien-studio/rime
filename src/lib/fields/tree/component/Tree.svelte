<script lang="ts">
	import { capitalize } from '$lib/utils/string.js';
	import AddItemButton from './AddItemButton.svelte';
	import TreeBlock from './TreeBlock.svelte';
	import { Field } from 'rizom/panel';
	import { useSortable } from '$lib/panel/utility/Sortable';
	import './tree.css';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import Sortable from 'sortablejs';
	import type { TreeProps } from './props';

	const { path, config, form }: TreeProps = $props();

	// let blockList: HTMLElement;

	const treeState = $derived(form.useTree(path));
	const field = $derived(form.useField(path, config));
	let rootEl;
	let sortingInitialized = $state(false);
	let sorting = $state(false);
	let sortableInstances = $state<ReturnType<typeof Sortable.create>[]>([]);

	let currentClone;
	const sortableOptions = {
		handle: '.rz-tree-item__grip',
		animation: 150,
		swapThreshold: 0.65,
		group: {
			name: `list-${path}`
		},
		onStart: () => (sorting = true),
		onUnchoose: () => (sorting = false),
		// onClone: function (/**Event*/ evt) {
		// 	var origEl = evt.item;
		// 	currentClone = evt.clone;
		// },
		onEnd: function (evt) {
			const { oldIndex, newIndex, from, to } = evt;

			const initialPath = evt.item.__attributes['data-path'];
			const targetListPath = to.__attributes['data-path'];
			const isTargetPathRoot = targetListPath === path;
			const targetPath = `${targetListPath}${!isTargetPathRoot ? '._children' : ''}.${newIndex}`;

			console.log('initialPath', initialPath);
			console.log('targetPath', targetPath);
			console.log('evt.pullMode', evt.pullMode);
			if (initialPath !== targetPath) {
				// if (currentClone) {
				// 	currentClone.remove();
				// }
				if (evt.pullMode) {
					evt.item.remove();
				}
				// if (initialPath.split('.').length !== targetPath.split('.').length) {
				// evt.item.remove();
				// }
				// if (rootEl) {
				// 	const toDelete = rootEl.querySelector('.rz-tree-item[data-sorting="true"]');
				// 	if (toDelete) toDelete.remove();
				// }
				treeState.moveItem(initialPath.replace(`${path}.`, ''), targetPath.replace(`${path}.`, ''));
				resetSortable();
			}
			// if (from !== to) {
			// 	const localePath = `${to.__attributes['data-path']}`;
			// 	const localeBlockState = form.useBlocks(localePath);
			// 	console.log('localePath', localePath);
			// 	console.log(localeBlockState);
			// 	// if (oldIndex !== undefined && newIndex !== undefined) {
			// 	// 	localeBlockState.moveBlock(oldIndex, newIndex);
			// 	// }
			// 	// treeState.setPath({
			// 	// of: evt.item.attributes.id,
			// 	// path: `${to.__attributes['data-path']}.${newIndex}`
			// 	// });
			// }

			// if (oldIndex !== undefined && newIndex !== undefined) {
			// 	treeState.moveBlock(oldIndex, newIndex);
			// }
			// }

			sorting = false;
		}
	};
	const { sortable } = useSortable(sortableOptions);

	const nested = $derived(path.split('.').length > 1);

	const resetSortable = () => {
		sortableInstances.forEach((instance) => instance.destroy());
		sortableInstances = [];
		sortingInitialized = false;
	};
	const add = (options: Omit<TreeBlock, 'id' | 'path'>) => {
		treeState.addItem({
			...options
		});
		resetSortable();
	};

	$effect(() => {
		if (!sortingInitialized && treeState.items.length > 0 && !sortableInstances.length) {
			const lists = document.querySelectorAll(`.rz-tree__list[data-tree-key="${path}"]`);
			// console.log(lists);
			for (const [index, list] of lists.entries()) {
				sortableInstances[index] = Sortable.create(list, sortableOptions);
				// sortableInstances[index] = sortable(list);
			}
			sortingInitialized = true;
		}
	});

	// function getConfigByBlockType(type: string): BlocksFieldRaw['blocks'][number] {
	// 	const blockConfig = config.blocks.find((b) => type === b.name);
	// 	if (!blockConfig) {
	// 		throw new Error(`Block configuration not found for type: ${type}`);
	// 	}
	// 	return blockConfig;
	// }

	const hasBlocks = $derived(treeState.items && treeState.items.length);
</script>

<Field.Root class={config.className} visible={field.visible} disabled={!field.editable}>
	<Field.Error error={field.error} />

	<h3 class="rz-tree__title" class:rz-blocks__title--nested={nested || form.isLive}>
		{config.label ? config.label : capitalize(config.name)}
	</h3>

	<!-- path -->
	<!-- 0 -->
	<!-- 1 -->
	<!-- 0._children.2 -->

	<!-- deleteBlock={() => treeState.deleteBlock(index)}
	duplicateBlock={() => treeState.duplicateBlock(index)} -->

	<div
		class="rz-tree__list rz-tree__list--root"
		data-tree-key={path}
		bind:this={rootEl}
		data-path={path}
		data-empty={!hasBlocks ? '' : null}
	>
		{#if hasBlocks}
			{#each treeState.items as item, index (item.id)}
				<TreeBlock {form} {sorting} treeKey={path} path="{path}.{index}" {config} />
			{/each}
		{/if}
	</div>

	<AddItemButton
		addItem={add}
		class="rz-tree__add-button"
		size={nested ? 'sm' : 'default'}
		fields={config.fields}
	/>
</Field.Root>
