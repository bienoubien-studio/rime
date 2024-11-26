<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive, type WithoutChild } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import Minus from 'lucide-svelte/icons/minus';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChild<DropdownMenuPrimitive.CheckboxItemProps> = $props();
</script>

<DropdownMenuPrimitive.CheckboxItem
	bind:ref
	bind:checked
	class="rz-dropdown-checkbox {className}"
	{...restProps}
>
	{#snippet children({ checked })}
		<span class="rz-dropdown-checkbox__indicator">
			{#if checked === 'indeterminate'}
				<Minus size="13" />
			{:else}
				<Check size="13" />
			{/if}
		</span>
		{@render childrenProp?.({ checked })}
	{/snippet}
</DropdownMenuPrimitive.CheckboxItem>

<style type="postcss">
	:global {
		.rz-dropdown-checkbox {
			position: relative;
			display: flex;
			cursor: pointer;
			user-select: none;
			align-items: center;
			border-radius: var(--rz-radius-md);
			padding-left: var(--rz-size-8);
			font-size: var(--rz-text-sm);
			outline: none;
			@mixin py var(--rz-size-1-5);
			& [data-disabled] {
				pointer-events: none;
				opacity: 0.5;
			}
			& .rz-dropdown-checkbox[data-highlighted] {
				background-color: hsl(var(--rz-color-accent));
				@mixin color color-accent-fg;
			}
		}

		.rz-dropdown-checkbox__indicator {
			position: absolute;
			left: var(--rz-size-2);
		}
	}
</style>
