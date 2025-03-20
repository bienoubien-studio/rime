<script lang="ts">
	import { LiveProvider } from 'rizom/panel';
	import 'rizom/panel/style/reset.css';

	const { children } = $props();
</script>

<LiveProvider>
	{@render children()}
</LiveProvider>
