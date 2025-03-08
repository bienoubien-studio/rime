<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	type PrimitiveDivAttributes = WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PrimitiveDivAttributes = $props();
</script>

<div bind:this={ref} class="rz-card {className}" {...restProps}>
	{@render children?.()}
</div>

<style type="postcss">
	.rz-card {
		--bg: var(--rz-card-color-bg, var(--rz-ground-5));
		width: var(--rz-card-width, auto);
		background-color: hsl(var(--bg));
		border-radius: var(--rz-radius-lg);
		border: var(--rz-border);
	}
</style>
