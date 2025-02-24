<script lang="ts">
	import { capitalize } from '$lib/utils/string.js';
	import AddItemButton from './AddItemButton.svelte';
	import TreeBlockItem from './TreeBlockItem.svelte';
	import { Field } from 'rizom/panel';
	import './tree.css';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import Sortable from 'sortablejs';
	import type { TreeProps } from './props';
	import type { Dic } from 'rizom/types/utility';
	import { onDestroy } from 'svelte';
	import { watch } from 'runed';
	const { path, config, form }: TreeProps = $props();

	const treeState = $derived(form.useTree(path));
	const field = $derived(form.useField(path, config));
	let sortingInitialized = $state(false);
	let sorting = $state(false);
	let sortableInstances = $state<ReturnType<typeof Sortable.create>[]>([]);
	const hasBlocks = $derived(treeState.items && treeState.items.length);
	const key = $state(new Date().getTime().toString());
	const nested = $derived(path.split('.').length > 1);
	const shouldInit = $derived(!sortingInitialized && treeState.items.length > 0);

	const sortableOptions: Sortable.Options = {
		handle: '.rz-tree-item__grip',
		animation: 150,
		swapThreshold: 0.93,
		group: {
			name: `list-${key}`,
			put: (to, _, el, __) => {
				if (!el.classList.contains('rz-tree-item')) return false;
				const targetDepth = parseInt(to.el.dataset.treeDepth || '0');
				const childrenCount = parseInt(el.dataset.treeChildren || '0');
				return targetDepth + childrenCount <= config.maxDepth;
			}
		},
		onStart: () => (sorting = true),
		onUnchoose: () => (sorting = false),
		onEnd: function (evt) {
			const { newIndex, to } = evt;

			//@ts-ignore
			const initialPath = evt.item.__attributes['data-path'];
			//@ts-ignore
			const targetListPath = to.__attributes['data-path'];
			const isTargetPathRoot = targetListPath === path;
			const targetPath = `${targetListPath}${!isTargetPathRoot ? '._children' : ''}.${newIndex}`;

			if (initialPath !== targetPath) {
				treeState.moveItem(initialPath.replace(`${path}.`, ''), targetPath.replace(`${path}.`, ''));
				resetSortable();
			}

			sorting = false;
		}
	};

	const resetSortable = () => {
		destroySortable();
		sortingInitialized = false;
	};

	const destroySortable = () => {
		sortableInstances.forEach((instance) => instance.destroy());
		sortableInstances = [];
	};

	const add = (emptyValues: Dic) => {
		treeState.addItem({
			...emptyValues
		});
		resetSortable();
	};

	watch(() => treeState.stamp, resetSortable);

	$effect(() => {
		if (shouldInit) {
			const lists = document.querySelectorAll(`.rz-tree__list[data-tree-key="${key}"]`);
			for (const [index, list] of lists.entries()) {
				sortableInstances[index] = Sortable.create(list as HTMLElement, sortableOptions);
			}
			sortingInitialized = true;
		}
	});

	onDestroy(() => {
		destroySortable();
	});
</script>

<Field.Root class={config.className} visible={field.visible} disabled={!field.editable}>
	<Field.Error error={field.error} />

	<h3 class="rz-tree__title" class:rz-blocks__title--nested={nested || form.isLive}>
		{config.label ? config.label : capitalize(config.name)}
	</h3>

	{#key treeState.stamp}
		<div
			class="rz-tree__list rz-tree__list--root"
			data-tree-key={key}
			data-tree-depth="1"
			data-path={path}
			data-empty={!hasBlocks ? '' : null}
		>
			{#if hasBlocks}
				{#each treeState.items as item, index (item.id)}
					<TreeBlockItem
						{treeState}
						treeKey={key}
						path="{path}.{index}"
						{form}
						{sorting}
						{config}
					/>
				{/each}
			{/if}
		</div>
	{/key}
	<AddItemButton
		addItem={add}
		class="rz-tree__add-button"
		size={nested ? 'sm' : 'default'}
		fields={config.fields}
	/>
</Field.Root>
