<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { Minus } from 'lucide-svelte';
	import Check from 'lucide-svelte/icons/check';

	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChildrenOrChild<DropdownMenuPrimitive.CheckboxItemProps> & {
		children?: Snippet;
	} = $props();
</script>

<DropdownMenuPrimitive.CheckboxItem
	bind:ref
	bind:checked
	bind:indeterminate
	class="rz-dropdown-checkbox {className}"
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<span class="rz-dropdown-checkbox__indicator">
			{#if indeterminate}
				<Minus size="13" />
			{:else if checked}
				<Check size="13" />
			{/if}
		</span>
		{@render childrenProp?.()}
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
