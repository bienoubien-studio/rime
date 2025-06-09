<script lang="ts">
	import { type CollectionContext } from '$lib/panel/context/collection.svelte';
	import { getContext } from 'svelte';
	import LanguageSwitcher from '$lib/panel/components/ui/language-switcher/LanguageSwitcher.svelte';
	import DisplayMode from './DisplayMode.svelte';
	import SearchInput from './SearchInput.svelte';
	import SelectUI from './SelectUI.svelte';
	import ButtonCreate from './ButtonCreate.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';

	const collection = getContext<CollectionContext>('rizom.collectionList');

	const showSelectUI = $derived(!collection.isNested());
	const showDisplayMode = $derived(collection.isUpload || collection.config.nested);
</script>

{#if showDisplayMode}
	<div class="rz-collection-header__separator"></div>
	<DisplayMode />
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
