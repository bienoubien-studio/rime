<script lang="ts">
	import { setCollectionContext } from '$lib/panel/context/collection.svelte';
	import { type Snippet } from 'svelte';
	import Unauthorized from '$lib/panel/components/sections/unauthorized/Unauthorized.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import type { GenericDoc, PrototypeSlug } from '$lib/types/doc';

	type Props = {
		slug: PrototypeSlug;
		data: {
			docs: GenericDoc[];
			status: number;
			canCreate: boolean;
		};
		children: Snippet;
	};

	const { slug, data, children }: Props = $props();
	const { getCollection } = getConfigContext();

	setCollectionContext({
		initial: data.docs,
		config: getCollection(slug),
		canCreate: data.canCreate,
		key: slug
	});
</script>

{#if data.status === 200}
	{@render children()}
{:else}
	<Unauthorized />
{/if}
