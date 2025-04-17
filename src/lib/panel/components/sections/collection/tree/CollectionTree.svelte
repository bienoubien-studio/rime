<script lang="ts">
	import type { CollectionContext } from '$lib/panel/context/collection.svelte';
	import { onDestroy } from 'svelte';
	import Sortable from 'sortablejs';
	import CollectionTreeNode from './CollectionTreeNode.svelte';
	import { toast } from 'svelte-sonner';
	import { countRows } from './util';

	type Props = { collection: CollectionContext };
	const { collection }: Props = $props();

	// Track collection stamp for reactivity
	const collectionStamp = $derived(collection.stamp);

	let sortingInitialized = $state(false);
	let sorting = $state(false);
	let sortableInstances = $state<ReturnType<typeof Sortable.create>[]>([]);
	const shouldInit = $derived(!sortingInitialized && collection.docs.length > 0);

	const sortableOptions: Sortable.Options = {
		handle: '.rz-collection-node__grip',
		animation: 150,
		swapThreshold: 0.93,
		group: {
			name: `list-nested`
		},
		onStart: () => (sorting = true),
		onUnchoose: () => (sorting = false),
		onEnd: function (evt) {
			const { newIndex, oldIndex } = evt;
			
			//@ts-ignore
			const fromParentId = evt.item.getAttribute('data-parent') || evt.item.__attributes?.['data-parent'];
			//@ts-ignore
			const toParentId = evt.to.getAttribute('data-id') || evt.to.__attributes?.['data-id'];
			//@ts-ignore
			const nodeId = evt.item.getAttribute('data-id') || evt.item.__attributes?.['data-id']

			collection.handleNestedDocumentMove({
				documentId: nodeId,
				from: {
					parent: fromParentId === 'root' ? null : fromParentId,
					index: oldIndex || 0
				},
				to: {
					parent: toParentId === 'root' ? null : toParentId,
					index: newIndex || 0
				}
			}).then(success => {
				if(success){
					toast.success('Order updated')
					resetSortable();
					sorting = false;
				}else{
					toast.error('An error occured')
				}
			});
		}
	};

	const initSortable = () => {
		// Get all sortable containers including the root and nested ones
		const sortableContainers = document.querySelectorAll('.rz-collection-sortable');

		// Create Sortable instance for each container
		sortableContainers.forEach((container) => {
			const instance = Sortable.create(container as HTMLElement, sortableOptions);
			sortableInstances.push(instance);
		});
	};

	const resetSortable = () => {
		destroySortable();
		sortingInitialized = false;
	};

	const destroySortable = () => {
		sortableInstances.forEach((instance) => instance.destroy());
		sortableInstances = [];
	};

	
	$effect(() => {
		if (shouldInit) {
			initSortable();
			sortingInitialized = true;
		}
	});

	onDestroy(() => {
		destroySortable();
	});
</script>

{#key `${collectionStamp}`}
	<div
		class="rz-collection-sortable rz-collection-sortable--root"
		data-id="root"
		style="--data-rows-count={countRows(collection.nested)}"
		data-empty={collection.nested.length === 0 ? '' : null}
	>
		{#each collection.nested as doc}
			<CollectionTreeNode {collection} parentId="root" {doc} />
		{/each}
	</div>
{/key}

<style lang="postcss">
	
	.rz-collection-sortable {
		height:100%;
		--dot-size: 1px;
    --dot-space: 12px;
    background-color: hsl(var(--rz-ground-5));
    background-image: radial-gradient(hsl(var(--rz-ground-4)) var(--dot-size), transparent var(--dot-size));
    background-size: var(--dot-space) var(--dot-space);
    background-position: 0 0;

		/* display: grid; */
		padding-left: var(--rz-size-20);
		padding-top: var(--rz-size-20);
		padding-right: var(--rz-size-20);
		position: relative;

		& :global {
			.rz-collection-sortable {
				display: grid;
				margin-left: var(--rz-size-12);
				min-height: var(--rz-size-4);
			}
			.rz-collection-sortable:has(.rz-collection-node) {
				&::before{
					content: '';
					border-left: var(--rz-border);
					translate: calc(-1 * var(--rz-size-6)) calc(-1 * var(--rz-size-4));
					position: absolute;
					top: 0;
					height: calc( var(--rz-size-4) + var(--rz-size-8) + (var(--data-rows-count) - 1) * var(--rz-size-20));
					left:0;
				}
				margin-top: var(--rz-size-4);
				position: relative;
			}
		}
	}
</style>
