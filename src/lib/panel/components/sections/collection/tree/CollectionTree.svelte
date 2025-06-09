<script lang="ts">
	import type { CollectionContext } from '$lib/panel/context/collection.svelte';
	import { getContext, onDestroy } from 'svelte';
	import Sortable from 'sortablejs';
	import CollectionTreeNode from './CollectionTreeNode.svelte';
	import { toast } from 'svelte-sonner';
	import { countRows } from './util';

	const collection = getContext<CollectionContext>('rizom.collectionList');
		
	// Track collection stamp for reactivity
	const collectionStamp = $derived(collection.stamp);

	let sortingInitialized = $state(false);
	
	let sortableInstances = $state<ReturnType<typeof Sortable.create>[]>([]);
	const shouldInit = $derived(!sortingInitialized && collection.docs.length > 0);

	const sortableOptions: Sortable.Options = {
		handle: '.rz-collection-node__grip',
		animation: 150,
		swapThreshold: 0.93,
		group: {
			name: `list-nested`
		},
		onEnd: function (evt) {
			const { newIndex, oldIndex } = evt;
			
			//@ts-expect-error boring
			const fromParentId = evt.item.getAttribute('data-parent') || evt.item.__attributes?.['data-parent'];
			//@ts-expect-error boring
			const toParentId = evt.to.getAttribute('data-id') || evt.to.__attributes?.['data-id'];
			//@ts-expect-error boring
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
		{#each collection.nested as doc, index (index)}
			<CollectionTreeNode {collection} parentId="root" {doc} />
		{/each}
	</div>
{/key}

<style lang="postcss">
	
	.rz-collection-sortable {
		height:100%;
		background-color: hsl(var(--rz-ground-5));
    background-position: 0 0;
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
