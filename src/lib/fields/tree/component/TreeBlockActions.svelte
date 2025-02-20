<script lang="ts">
	import { CopyPlus, Trash2 } from 'lucide-svelte';
	import { Button } from 'rizom/panel/components/ui/button';

	type Props = {
		deleteItem: () => void;
		duplicateItem: () => void;
	};

	const { deleteItem, duplicateItem }: Props = $props();
</script>

<div class="rz-tree-item-actions">
	<Button variant="outline" size="icon" onclick={duplicateItem}>
		<CopyPlus size={11} />
	</Button>
	<Button variant="outline" size="icon" onclick={deleteItem}>
		<Trash2 size={11} />
	</Button>
</div>

<style type="postcss">
	.rz-tree-item-actions {
		display: flex;
		gap: var(--rz-size-2);
	}
	/* .rz-tree-item-action {
		border: var(--rz-border);
		background-color: hsl(var(--rz-ground-6));
		border-radius: 1rem;
		height: var(--rz-size-6);
		width: var(--rz-size-6);
		display: flex;
		align-items: center;
		justify-content: center;
	} */

	/* :global(.rz-tree-item-actions__content) {
		width: auto;
		padding: var(--rz-size-1);
	} */

	/* :global(.rz-tree-item-actions__delete-button) {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: flex-end;
		gap: var(--rz-size-3);
	} */
</style>
