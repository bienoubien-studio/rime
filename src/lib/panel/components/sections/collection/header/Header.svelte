<script lang="ts">
	import { type CollectionContext } from '$lib/panel/context/collection.svelte';
	import { getContext } from 'svelte';
	import LanguageSwitcher from '$lib/panel/components/ui/language-switcher/LanguageSwitcher.svelte';
	import DisplayMode from './DisplayMode.svelte';
	import SearchInput from './SearchInput.svelte';
	import SelectUI from './SelectUI.svelte';
	import ButtonCreate from './ButtonCreate.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import { invalidateAll } from '$app/navigation';

	type Props = { compact: boolean };
	const { compact }: Props = $props();

	const collection = getContext<CollectionContext>('rizom.collectionList');

	const showSelectUI = $derived(!collection.isNested() && !compact);
	const showSearchInput = $derived(
		(!collection.isNested() || (collection.isNested() && compact)) && !collection.selectMode
	);
	const showDisplayMode = $derived(
		(collection.isUpload && !compact) || (collection.config.nested && !compact)
	);
	const showCompactCreateButton = $derived(compact);
	const showFullHeader = $derived(!compact);

	const config = getConfigContext();
</script>

<div class:rz-collection-header--compact={compact} class="rz-collection-header">
	<div class="rz-collection-header__left">
		{#if showDisplayMode}
			<DisplayMode />
			<div class="rz-collection-header__separator"></div>
		{/if}

		{#if showSelectUI}
			<SelectUI />
		{/if}

		{#if showSearchInput}
			<SearchInput {compact} />
		{/if}

		{#if showCompactCreateButton}
			<ButtonCreate size="sm" />
		{/if}
	</div>

	{#if showFullHeader}
		<div class="rz-collection-header__right">
			{#each config.raw.panel.components.collectionHeader as CustomHeaderComponent, index (index)}
				<CustomHeaderComponent />
			{/each}
			<ButtonCreate />
			<LanguageSwitcher onLocalClick={() => invalidateAll()} />
		</div>
	{/if}
</div>

<style type="postcss">
	.rz-collection-header {
		container-type: inline-size;
		display: flex;
		height: var(--rz-size-14);
		align-items: center;
		justify-content: space-between;
		border-bottom: var(--rz-border);
		@mixin px var(--rz-size-6);
		font-size: var(--rz-text-sm);
	}

	.rz-collection-header__separator {
		border-left: var(--rz-border);
		height: 1rem;
	}

	.rz-collection-header--compact {
		:global(.rz-button) {
			flex-shrink: 0;
		}
	}

	.rz-collection-header__left {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--rz-size-2);
	}

	@container (min-width:640px) {
		.rz-collection-header__left {
			gap: var(--rz-size-6);
		}
	}

	.rz-collection-header__right {
		display: flex;
		gap: var(--rz-size-4);
	}
</style>
