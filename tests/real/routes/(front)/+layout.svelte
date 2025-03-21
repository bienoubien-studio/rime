<script lang="ts">
	import { LiveProvider } from 'rizom/panel';
	import '@bien-bien/css-reset';

	const { children } = $props();
</script>

<LiveProvider>
	{@render children()}
</LiveProvider>
