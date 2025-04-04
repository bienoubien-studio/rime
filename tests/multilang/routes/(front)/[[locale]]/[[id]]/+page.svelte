<script lang="ts">
	import { LiveConsumer } from 'rizom/panel';

	let { data } = $props();
</script>

<LiveConsumer {data}>
	{#snippet child(doc)}
		{/* @ts-ignore */ null}
		{doc.title}
	{/snippet}
</LiveConsumer>
