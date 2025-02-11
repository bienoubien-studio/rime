<script lang="ts">
	import { SquarePlus } from 'lucide-svelte';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { getContext } from 'svelte';
	import { type CollectionContext } from 'rizom/panel/context/collection.svelte';
	import { t__ } from 'rizom/panel/i18n/index.js';

	type ButtonSize = 'sm' | 'default';
	const { size = 'default' }: { size?: ButtonSize } = $props();
	const collection = getContext<CollectionContext>('collectionList');

	const isSmallSize = $derived(size === 'sm');
	const buttonVariant = $derived(isSmallSize ? 'ghost' : 'default');
	const buttonSize = $derived(isSmallSize ? 'icon-sm' : 'default');
	const buttonLabel = $derived(
		t__(`common.create_new|${collection.config.label.gender}`, collection.config.label.singular)
	);
</script>

{#if collection.canCreate}
	<Button variant={buttonVariant} size={buttonSize} href="/panel/{collection.config.slug}/create">
		{#if isSmallSize}
			<SquarePlus size={16} />
		{:else}
			{buttonLabel}
		{/if}
	</Button>
{/if}
