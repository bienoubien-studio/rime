<script lang="ts">
	import { page } from '$app/state';
	import { setLiveContext } from '$lib/panel/context/live.svelte';
	import { beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	let live = setLiveContext(page.url.href);
	beforeNavigate(live.beforeNavigate);

	const { children } = $props();

	onMount(() => {
		console.log('[Provider] add event');
		window.addEventListener('message', live.onMessage);
	});
</script>

{@render children()}
