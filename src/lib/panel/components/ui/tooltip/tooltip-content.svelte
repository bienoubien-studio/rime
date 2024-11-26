<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import './tooltip.css';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		...restProps
	}: TooltipPrimitive.ContentProps = $props();
</script>

<TooltipPrimitive.Content bind:ref {sideOffset} class="rz-tooltip {className}" {...restProps} />
