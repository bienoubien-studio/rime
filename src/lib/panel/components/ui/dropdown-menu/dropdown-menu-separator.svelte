<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DropdownMenuPrimitive.SeparatorProps = $props();
</script>

<DropdownMenuPrimitive.Separator
	bind:ref
	class="rz-dropdown-separator {className}"
	{...restProps}
/>

<style type="postcss">
	:global {
		.rz-dropdown-separator {
			@mixin bg color-border, 0.5;
			@mixin my var(--rz-size-1);
			height: 1px;
		}
	}
</style>
