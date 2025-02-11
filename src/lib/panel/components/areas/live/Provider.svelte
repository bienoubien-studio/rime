<script lang="ts">
	import { page } from '$app/stores';
	import { setLiveContext } from '$lib/panel/context/live.svelte';
	import { beforeNavigate } from '$app/navigation';

	let live = setLiveContext($page.url.href);
	beforeNavigate(live.beforeNavigate);

	const { children } = $props();
</script>

<svelte:window onmessage={live.onMessage} />

{@render children()}
