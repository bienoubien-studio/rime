<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import './popover-content.css';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PopoverPrimitive.ContentProps = $props();
</script>

<PopoverPrimitive.Portal>
	<PopoverPrimitive.Content bind:ref class="rz-popover {className}" {...restProps} />
</PopoverPrimitive.Portal>
