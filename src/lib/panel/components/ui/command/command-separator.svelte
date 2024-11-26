<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CommandPrimitive.SeparatorProps = $props();
</script>

<CommandPrimitive.Separator class="rz-command-separator {className}" bind:ref {...restProps} />

<style type="postcss">
	:global(.rz-command-separator) {
		@mixin bg color-border;
		margin-left: calc(-1 * var(--rz-size-1));
		margin-right: calc(-1 * var(--rz-size-1));
		height: 1px;
	}
</style>
