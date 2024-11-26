<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title bind:ref class="rz-dialog-title {className}" {...restProps} />

<style type="postcss">
	:global(.rz-dialog-title) {
		font-size: var(--rz-text-lg);
		@mixin font-semibold;
	}
</style>
