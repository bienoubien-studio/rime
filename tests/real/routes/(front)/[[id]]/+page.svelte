<script lang="ts">
	import { renderRichText } from 'rizom/fields/rich-text/utils/render.js';
	import LiveConsumer from 'rizom/panel/components/sections/live/Consumer.svelte';
	
	let { data }: { data: { doc: PagesDoc } } = $props();
</script>

<LiveConsumer {data}>
	{#snippet child(doc)}
		
		<h1>{doc.attributes.title}</h1>
		<!-- {@html renderRichText(doc)} -->
		
	{/snippet}
</LiveConsumer>

<style>
	h1 {
		font-size: 3rem;
	}
</style>
