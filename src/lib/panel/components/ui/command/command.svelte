<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		...restProps
	}: CommandPrimitive.RootProps = $props();
</script>

<CommandPrimitive.Root class="rz-command {className}" bind:value bind:ref {...restProps} />

<style type="postcss">
	:global(.rz-command) {
		@mixin bg color-popover;
		@mixin color color-popover-fg;
		display: flex;
		height: 100%;
		width: 100%;
		flex-direction: column;
		border-radius: var(--rz-radius-md);
	}
</style>
