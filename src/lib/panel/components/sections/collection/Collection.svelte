<script lang="ts">
	import { getContext, setContext } from 'svelte';
	import GridItem from './grid-item/GridItem.svelte';
	import ListRow from './list-row/ListRow.svelte';
	import ListHeader from './list-header/ListHeader.svelte';
	import Header from './header/Header.svelte';
	import ScrollArea from '$lib/panel/components/ui/scroll-area/scroll-area.svelte';
	import { getCollectionContext } from '$lib/panel/context/collection.svelte';
	import { page } from '$app/state';
	import type { PrototypeSlug } from '$lib/core/types/doc';
	import { t__ } from '$lib/core/i18n/index.js';
	import Button from '../../ui/button/button.svelte';
	import CollectionTree from './tree/CollectionTree.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';

	interface Props {
		compact?: boolean;
		slug: PrototypeSlug;
	}

	const { slug, compact = false }: Props = $props();

	const title = getContext<{ value: string }>('title');

	const collection = getCollectionContext(slug);
	const user = getUserContext()

	setContext('rizom.collectionList', collection);

	let currentDoc = $derived(page.params.id || null);

	const className = $derived.by(() => {
		if(collection.isGrid()){
			return 'rz-scroll-area--grid'
		}else if( collection.isNested() ){
			return 'rz-scroll-area--nested'
		}else{
			return null
		}
	});

	title.value = collection.title;

	//
</script>

<div class="rz-collection-area">
	<div class="rz-collection-area__header">
		<Header {compact} />

		{#if collection.isList()}
			<ListHeader {compact} />
		{/if}
	</div>

	<ScrollArea class={className}>
		{#if !collection.docs.length}
			{#if !compact}
				<div class="rz-collection-area__empty">
					<div>
						<span>
							{t__(
								`common.no_document|${collection.config.label.gender}`,
								collection.config.label.singular
							)}
						</span>
						{#if collection.config.access.create(user.attributes, {})}
							<Button href="/panel/{collection.config.slug}/create" variant="outline">
								{t__(
									`common.create_first|${collection.config.label.gender}`,
									collection.config.label.singular
								)}
							</Button>
						{/if}
					</div>
				</div>
			{/if}
		{:else if collection.isNested() && !compact}
			<CollectionTree {collection} />
		{:else}
			<div
				class:rz-collection-area__list={!collection.isGrid()}
				class:rz-collection-area__grid={collection.isGrid()}
			>
				{#each collection.docs as doc, index (index)}
					{@const checked = collection.selected.includes(doc.id)}
					{@const active = currentDoc === doc.id}
					{#if collection.isList() || (compact && collection.isNested())}
						<ListRow {doc} {checked} {compact} {active} />
					{:else if collection.isGrid()}
						<GridItem {doc} {checked} />
					{/if}
				{/each}
			</div>
		{/if}
	</ScrollArea>
</div>

<style type="postcss">
	.rz-collection-area {
		container: collection-area / inline-size;
		height: 100vh;
		width: 100%;
		overflow-y: scroll;
		text-align: left;
		& :global(.rz-scroll-area) {
			height: calc(100vh - 7.5rem);
			width: 100%;
		}
		& :global(.rz-scroll-area--grid) {
			height: calc(100vh - 3.5rem);
			background-color: hsl(var(--rz-ground-6));
		}
		& :global(.rz-scroll-area--nested) {
			height: calc(100vh - 3.5rem);
			background-color: hsl(var(--rz-ground-6));
		}

		background-color: hsl(var(--rz-ground-6));
	}

	.rz-collection-area__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--rz-size-4);
		padding: var(--rz-size-4);
		@container collection-area (min-width:420px) {
			gap: var(--rz-size-6);
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		}
	}

	.rz-collection-area__list {
		padding: 0 var(--rz-size-5);
	}
	.rz-collection-area__empty {
		place-content: center;
		display: grid;
		height: 100%;
		@mixin font-medium;
		& > div {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--rz-size-3);
		}
	}
</style>
