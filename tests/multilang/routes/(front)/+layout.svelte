<script lang="ts">
	import LiveProvider from '$lib/panel/components/areas/live/Provider.svelte';
	import { classList } from '$lib/utils/classList';

	const { children } = $props();
</script>

<svelte:body use:classList={'app'} />

<LiveProvider>
	{@render children()}
</LiveProvider>
