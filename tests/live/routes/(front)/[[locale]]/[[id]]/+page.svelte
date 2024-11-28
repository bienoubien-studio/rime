<script lang="ts">
	import { getLiveContext } from '$lib/panel/context/live.svelte';

	let { data } = $props();
	const live = getLiveContext();
	const doc = $derived(live.doc || data.doc);

	$effect(() => {
		if (live.enabled) {
			live.doc = data.doc;
		}
	});
	//
</script>

{#if doc._live && !live.enabled}
	<a href={doc._live}>Edit Live</a>
{/if}
