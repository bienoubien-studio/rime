<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div bind:this={ref} class="rz-dialog-footer {className}" {...restProps}>
	{@render children?.()}
</div>

<style type="postcss">
	.rz-dialog-footer {
		display: flex;
		flex-direction: column-reverse;
	}

	@media (min-width: 640px) {
		.rz-dialog-footer {
			flex-direction: row;
			justify-content: flex-end;
		}
	}
</style>
