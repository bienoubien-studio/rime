<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		sideOffset = 4,
		class: className,
		...restProps
	}: DropdownMenuPrimitive.ContentProps = $props();
</script>

<DropdownMenuPrimitive.Content
	bind:ref
	{sideOffset}
	class="rz-dropdown-content {className}"
	{...restProps}
/>

<style type="postcss">
	:global {
		.rz-dropdown-content {
			background-color: hsl(var(--rz-ground-6));
			z-index: 50;
			min-width: var(--min-width, 8rem);
			border-radius: var(--rz-radius-md);
			border: var(--rz-border);
			padding: var(--rz-size-1);
			box-shadow: var(--rz-shadow-xl);
		}
		.rz-dropdown-content:focus {
			outline: none;
		}
	}
</style>
