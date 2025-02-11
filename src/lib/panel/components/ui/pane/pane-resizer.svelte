<script>
	import { GripVertical } from 'lucide-svelte';
	import { PaneResizer } from 'paneforge';
</script>

<PaneResizer>
	<div class="rz-pane-resizer">
		<GripVertical size="12" />
	</div>
</PaneResizer>

<style>
	:global(.rz-pane-resizer) {
		position: absolute;
		translate: -50% 0;
		padding: var(--rz-size-2) var(--rz-size-1);
		border: var(--rz-border);
		border-radius: var(--rz-radius-sm);
		top: calc(50vh - var(--rz-size-12));
		background-color: hsl(var(--rz-ground-6));
	}
</style>
