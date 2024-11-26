<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DropdownMenuPrimitive.ItemProps & {
		inset?: boolean;
	} = $props();
</script>

<DropdownMenuPrimitive.Item bind:ref class="rz-dropdown-item {className}" {...restProps} />

<style type="postcss">
	:global {
		.rz-dropdown-item {
			position: relative;
			display: flex;
			cursor: pointer;
			user-select: none;
			align-items: center;
			border-radius: var(--rz-radius-md);
			font-size: var(--rz-text-sm);
			outline: none;
			@mixin py var(--rz-size-1-5);
			@mixin px var(--rz-size-2);
			&[data-highlighted] {
				background-color: hsl(var(--rz-ground-5));
			}
			&[data-disabled] {
				pointer-events: none;
				opacity: 0.5;
			}
		}
	}
</style>
