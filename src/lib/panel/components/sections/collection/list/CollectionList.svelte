<script lang="ts">
	import type { CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import Empty from '../Empty.svelte';
	import Row from './row/Row.svelte';

	type Props = { collection: CollectionContext };
	const { collection }: Props = $props();
</script>

{#if collection.docs.length}
	<div class="rz-page-collection__list">
		{#each collection.docs as doc, index (index)}
			{@const checked = collection.selected.includes(doc.id)}
			<Row {doc} {checked} />
		{/each}
	</div>
{:else}
	<Empty {collection} />
{/if}

<style lang="postcss">
	.rz-page-collection__list {
		gap: var(--rz-size-2);
		display: grid;
	}
</style>
