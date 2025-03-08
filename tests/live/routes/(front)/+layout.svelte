<script lang="ts">
	import LiveProvider from '$lib/panel/components/sections/live/Provider.svelte';
	import { classList } from '$lib/util/classList';

	const { children } = $props();
</script>

<svelte:body use:classList={'app'} />

<LiveProvider>
	{@render children()}
</LiveProvider>
