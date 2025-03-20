<script lang="ts">
	import { renderRichText } from 'rizom/fields/rich-text/render.js';
	import LiveConsumer from 'rizom/panel/components/sections/live/Consumer.svelte';

	let { data } = $props();
</script>

<LiveConsumer {data}>
	{#snippet child(doc)}
		{@const summary = doc.attributes.summary}
		{@const thumbnail = summary.thumbnail ? summary.thumbnail[0] : null}
		<h1>{doc.attributes.title}</h1>
		{@html renderRichText(doc.attributes.summary.intro)}
		{#if thumbnail}
			<img width="120px" src={thumbnail.sizes.sm} alt={thumbnail.alt} />
		{/if}
		{#each doc.layout.sections as section}
			{section.type}<br />
		{/each}
	{/snippet}
</LiveConsumer>

<style>
	h1 {
		font-size: 3rem;
	}
</style>
