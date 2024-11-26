<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CommandPrimitive.ListProps = $props();
</script>

<CommandPrimitive.List class="rz-command-list {className}" {...restProps} bind:ref />

<style type="postcss">
	:global(.rz-command-list) {
		overflow-x: hidden;
	}
</style>
