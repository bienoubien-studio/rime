<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { Check } from '@lucide/svelte';

	let {
		ref = $bindable(null),
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChild<DropdownMenuPrimitive.RadioItemProps> = $props();
</script>

<DropdownMenuPrimitive.RadioItem bind:ref class="rz-dropdown-radio {className}" {...restProps}>
	{#snippet children({ checked })}
		<span class="rz-dropdown-radio__indicator">
			{#if checked}
				<Check size="13" />
			{/if}
		</span>
		{@render childrenProp?.({ checked })}
	{/snippet}
</DropdownMenuPrimitive.RadioItem>

<style type="postcss">
	:global {
		.rz-dropdown-radio {
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
		}
		.rz-dropdown-radio[data-disabled] {
			pointer-events: none;
			opacity: 0.5;
		}

		.rz-dropdown-radio[data-highlighted] {
			background-color: hsl(var(--rz-ground-5));
			@mixin color color-fg;
		}

		.rz-dropdown-radio__indicator {
			position: absolute;
			left: var(--rz-size-2);
		}
	}
</style>
