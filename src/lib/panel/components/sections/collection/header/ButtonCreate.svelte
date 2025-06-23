<script lang="ts">
	import { CirclePlus, SquarePlus } from '@lucide/svelte';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { getContext } from 'svelte';
	import { type CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import { t__ } from '$lib/core/i18n/index.js';
	import { page } from '$app/state';
	import { PARAMS } from '$lib/core/constant.js';

	type ButtonSize = 'sm' | 'default';
	const { size = 'default' }: { size?: ButtonSize } = $props();
	const collection = getContext<CollectionContext>('rizom.collectionList');

	const isSmallSize = $derived(size === 'sm');
	const buttonVariant = $derived(isSmallSize ? 'ghost' : 'default');
	const buttonSize = $derived(isSmallSize ? 'icon-sm' : 'default');
	const buttonLabel = $derived(
		t__(`common.create_new|${collection.config.label.gender}`, collection.config.label.singular)
	);

	const createURL = $derived.by(() => {
		const currentUploadPath = page.url.searchParams.get(PARAMS.UPLOAD_PATH)
		if(collection.config.upload){
			return `/panel/${collection.config.slug}/create?${PARAMS.UPLOAD_PATH}=${currentUploadPath || 'root'}` 
		}
		return `/panel/${collection.config.slug}/create`
	})

</script>

{#if collection.canCreate}
	<Button variant={buttonVariant} size={buttonSize} href={createURL}>
		{#if isSmallSize}
			<CirclePlus size={16} />
		{:else}
			{buttonLabel}
		{/if}
	</Button>
{/if}
