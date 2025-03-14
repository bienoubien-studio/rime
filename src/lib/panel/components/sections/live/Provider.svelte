<script lang="ts">
	import { page } from '$app/state';
	import { setLiveContext } from '$lib/panel/context/live.svelte';
	import { beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';

	let live = setLiveContext(page.url.href);
	beforeNavigate(live.beforeNavigate);

	const { children } = $props();

	$effect(() => {
		if (browser) {
			window.addEventListener('message', live.onMessage);
		}
	});
</script>

{@render children()}
