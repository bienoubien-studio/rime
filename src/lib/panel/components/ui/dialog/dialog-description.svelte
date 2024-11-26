<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.DescriptionProps = $props();
</script>

<DialogPrimitive.Description bind:ref class="rz-dialog-description {className}" {...restProps} />

<style type="postcss">
	:global(.rz-dialog-description) {
		@mixin color color-fg, 0.7;
		font-size: var(--rz-text-sm);
	}
</style>
