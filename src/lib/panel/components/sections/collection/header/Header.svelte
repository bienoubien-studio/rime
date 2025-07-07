<script lang="ts">
	import { type CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import { getContext } from 'svelte';
	import DisplayMode from './DisplayMode.svelte';
	import SelectUI from './SelectUI.svelte';
	import CreateUploadFolder from './CreateUploadFolder.svelte';

	const collection = getContext<CollectionContext>('rizom.collectionList');

	const showSelectUI = $derived(!collection.isNested());
	const showDisplayMode = $derived(collection.isUpload || collection.config.nested);
</script>

{#if showDisplayMode}
	<div class="rz-collection-header__separator"></div>
	<DisplayMode />
{/if}

{#if collection.config.upload && collection.isGrid()}
	<div class="rz-collection-header__separator"></div>
	<CreateUploadFolder {collection} />
{/if}

{#if showSelectUI}
	<div class="rz-collection-header__separator"></div>
	<SelectUI />
{/if}

<style type="postcss">
	.rz-collection-header__separator {
		border-left: var(--rz-border);
		height: 1rem;
	}
</style>
