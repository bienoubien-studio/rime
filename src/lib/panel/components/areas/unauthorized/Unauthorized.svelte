<script>
	import Ban from 'lucide-svelte/icons/ban';
</script>

<div class="rz-unauthorized">
	<Ban />
	<p>Not authorized</p>
</div>

<style type="postcss">
	.rz-unauthorized {
		display: grid;
		height: 100vh;
		place-content: center;
		gap: var(--rz-size-3);
	}
	.rz-unauthorized p {
		@mixin font-semibold;
		font-size: var(--rz-text-lg);
	}
</style>
