<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { fly, fade } from "svelte/transition";
	import './tooltip.css';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		children,
		...restProps
	}: TooltipPrimitive.ContentProps = $props();
</script>

<TooltipPrimitive.Content bind:ref forceMount   {sideOffset} {...restProps} >
	{#snippet child({ wrapperProps, props, open })}
	{#if open}
				<div {...wrapperProps}>
					<div {...props} class="rz-tooltip {className}" transition:fly={{duration: 300}}>
						{@render children?.()}
					</div>
				</div>
			{/if}
	{/snippet}
	</TooltipPrimitive.Content>
