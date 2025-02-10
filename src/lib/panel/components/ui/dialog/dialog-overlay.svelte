<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay bind:ref class="rz-dialog-overlay {className}" {...restProps} />

<style type="postcss">
	:global(.rz-dialog-overlay) {
		background-color: hsl(var(--rz-color-bg) / 0.6);
		position: fixed;
		inset: 0;
		z-index: 50;
		backdrop-filter: blur(8px);
	}
</style>
