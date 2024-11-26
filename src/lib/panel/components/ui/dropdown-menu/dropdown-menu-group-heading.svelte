<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	type Props = DropdownMenuPrimitive.GroupHeadingProps & {
		inset?: boolean;
	};

	let { ref = $bindable(null), class: className, inset, ...restProps }: Props = $props();

	const insetClass = $derived(inset ? 'rz-dropdown-menu-group-heading--inset' : '');
</script>

<DropdownMenuPrimitive.GroupHeading
	bind:ref
	class="rz-dropdown-menu-group-heading {insetClass} {className}"
	{...restProps}
/>

<style type="postcss">
	:global {
		.rz-dropdown-menu-group-heading {
			padding: var(--rz-size-1-5) var(--rz-size-2);
			font-size: var(--rz-text-sm);
			@mixin font-semibold;
		}

		.rz-dropdown-menu-group-heading--inset {
			padding-left: var(--rz-size-8);
		}
	}
</style>
