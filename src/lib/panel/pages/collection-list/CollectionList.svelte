<script lang="ts">
	import { setCollectionContext } from '$lib/panel/context/collection.svelte';
	import { getContext, setContext, type Snippet } from 'svelte';
	import Unauthorized from '$lib/panel/components/sections/unauthorized/Unauthorized.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import type { GenericDoc, PrototypeSlug } from '$lib/core/types/doc';
	import Page from '$lib/panel/components/sections/page-layout/Page.svelte';
	import PageHeader from '$lib/panel/components/ui/page-header/PageHeader.svelte';
	import LanguageSwitcher from '$lib/panel/components/ui/language-switcher/LanguageSwitcher.svelte';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { t__ } from '../../../core/i18n/index.js';
	import { getUserContext } from '$lib/panel/context/user.svelte.js';
	import CollectionTree from '$lib/panel/components/sections/collection/tree/CollectionTree.svelte';
	import ListRow from '$lib/panel/components/sections/collection/list-row/ListRow.svelte';
	import GridItem from '$lib/panel/components/sections/collection/grid-item/GridItem.svelte';
	import CollectionHeader from '$lib/panel/components/sections/collection/header/Header.svelte';
	import SearchInput from '$lib/panel/components/sections/collection/header/SearchInput.svelte';
	import ButtonCreate from '$lib/panel/components/sections/collection/header/ButtonCreate.svelte';

	type Props = {
		slug: PrototypeSlug;
		data: {
			docs: GenericDoc[];
			status: number;
			canCreate: boolean;
		};
	};

	const { data, slug }: Props = $props();
	const config = getConfigContext();
	const collectionConfig = config.getCollection(slug);
	const user = getUserContext();
	// const config = getCollection(slug)

	const collection = setCollectionContext({
		initial: data.docs,
		config: collectionConfig,
		canCreate: data.canCreate,
		key: slug
	});

	const searchDisabled = $derived(collection.isNested() || collection.selectMode);

	setContext('rizom.collectionList', collection);
	const titleContext = getContext<{ value: string }>('title');
	titleContext.value = collection.config.label.plural;
</script>

{#if data.status === 200}
	<Page>
		{#snippet main()}
			<PageHeader>
				{#snippet title()}
					{collection.title}
				{/snippet}

				{#snippet bottomLeft()}
					<ButtonCreate size="sm" />
					<CollectionHeader />
				{/snippet}

				{#snippet topRight()}
					{#each config.raw.panel.components.collectionHeader as CustomHeaderComponent, index (index)}
						<CustomHeaderComponent />
					{/each}
					{#if config.raw.localization}
						<LanguageSwitcher onLocalClick={() => invalidateAll()} />
					{/if}
				{/snippet}

				{#snippet bottomRight()}
					<SearchInput disabled={searchDisabled} />
				{/snippet}
			</PageHeader>

			<div class="rz-collection__docs">
				<!-- {#if collection.isList()}
					<ListHeader />
				{/if} -->

				{#if !collection.docs.length}
					<div class="rz-page-collection__empty">
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
				{:else if collection.isNested()}
					<CollectionTree />
				{:else}
					<div
						class:rz-page-collection__list={!collection.isGrid()}
						class:rz-page-collection__grid={collection.isGrid()}
					>
						{#each collection.docs as doc, index (index)}
							{@const checked = collection.selected.includes(doc.id)}

							{#if collection.isList()}
								<ListRow {doc} {checked} />
							{:else if collection.isGrid()}
								<GridItem {doc} {checked} />
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/snippet}
	</Page>
{:else}
	<Unauthorized />
{/if}

<style type="postcss">
	.rz-collection__docs {
		container: collection-area / inline-size;
		width: 100%;
		text-align: left;
		padding: var(--rz-size-6) var(--rz-page-gutter);
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

		/* background-color: hsl(var(--rz-ground-5)); */
	}

	.rz-page-collection__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--rz-size-4);
		@container collection-area (min-width:420px) {
			gap: var(--rz-size-6);
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		}
	}

	.rz-page-collection__list {
		gap: var(--rz-size-2);
		display: grid;
	}
	.rz-page-collection__empty {
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
