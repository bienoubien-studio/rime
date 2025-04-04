<script lang="ts">
	import { LiveConsumer } from 'rizom/panel';

	let { data }: { data: { doc: NewsDoc } } = $props();
</script>

<LiveConsumer data={data}>
	{#snippet child(doc)}
		{doc.attributes.title}
		{#if doc.writer.text}
			{JSON.stringify(doc.writer.text)}
		{/if}
	{/snippet}
</LiveConsumer>
